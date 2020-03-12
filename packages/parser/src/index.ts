import templateParser from '@angular-eslint/template-parser';
import * as parser from '@typescript-eslint/parser';

export interface AngularESLintParserOptions extends parser.ParserOptions {
  filePath: string;
}

function quickExtractComponentDecorator(text: string) {
  const matches = text.match(/@Component\({(\s.*\s)*}\)/);
  if (!matches || !matches.length) {
    return null;
  }
  return matches[0];
}

function quickStripComponentDecoratorFromMetadata(
  componentDecoratorMatch: string,
): string {
  // remove @Component()
  return componentDecoratorMatch
    .slice(0, componentDecoratorMatch.length - 1)
    .replace('@Component(', '');
}

function parseForESLint(
  code: string,
  options: AngularESLintParserOptions,
): any {
  /**
   * For the Angular use-case we always need to parse in "module mode",
   * warn the user if they have explicitly set something other than that and override
   */
  if (options.sourceType && options.sourceType !== 'module') {
    console.warn(
      `WARNING: You have set "parserOptions.sourceType" to "${options.sourceType}", but only "module" is supported so your setting will be ignored`,
    );
  }
  options.sourceType = 'module';

  /**
   * SIMPLE CASE #1
   *
   * Component template .html files
   * - @angular-eslint/template-parser is all that's needed
   */
  if (options.filePath.endsWith('.component.html')) {
    return templateParser.parseForESLint(code, options);
  }
  /**
   * SIMPLE CASE #2
   *
   * Any files except component template .html and component .ts files
   * - Fallback to @typescript-eslint/parser
   */
  if (!options.filePath.endsWith('.component.ts')) {
    const parseResult: any = parser.parseForESLint(code, options);
    parseResult.services.defineTemplateBodyVisitor = () => {
      console.log('58');
      return {};
    };
    parseResult.services.convertNodeSourceSpanToLoc = () => {};
    return parseResult;
  }
  /**
   * COMPLEX CASE
   *
   * Component .ts files (which could have inline templates)
   * - A mixture of @typescript-eslint/parser and @angular-eslint/template-parser is needed
   */

  /**
   * For Components with inline templates, the eslint-plugin-template package provides a preprocessor
   * which will strip out everything except the template code, so at this code path we will either be
   * receiving:
   *
   * - The full .component.ts file source code
   * - Just an Angular HTML template source
   *
   * ...depending on whether or not the preprocessor has run on the file.
   */
  const componentDecoratorMatch = quickExtractComponentDecorator(code);
  if (
    !componentDecoratorMatch ||
    componentDecoratorMatch.includes('templateUrl') ||
    !componentDecoratorMatch.includes('template')
  ) {
    return templateParser.parseForESLint(code, options);
  }

  try {
    const metadataText = quickStripComponentDecoratorFromMetadata(
      componentDecoratorMatch,
    );
    const metadata: any = metadataText
      .split(',')
      .map(x => x.split(':').map(y => y.trim()))
      .reduce((a: any, x) => {
        a[x[0]] = x[1];
        return a;
      }, {});

    const angularTemplateParseResult = templateParser.parseForESLint(
      metadata.template,
      options,
    );

    const parseResult = parser.parseForESLint(code, options);

    return {
      ast: parseResult.ast,
      visitorKeys: {
        ...parseResult.visitorKeys,
        ...angularTemplateParseResult.visitorKeys,
      },
      scopeManager: parseResult.scopeManager,
      services: {
        convertNodeSourceSpanToLoc:
          angularTemplateParseResult.services.convertNodeSourceSpanToLoc,
        defineTemplateBodyVisitor:
          angularTemplateParseResult.services.defineTemplateBodyVisitor,
        program: parseResult.services.program,
        esTreeNodeToTSNodeMap: parseResult.services.esTreeNodeToTSNodeMap,
        tsNodeToESTreeNodeMap: parseResult.services.tsNodeToESTreeNodeMap,
      },
    };
  } catch (err) {
    console.log(err);
    console.error(
      'preprocess: ERROR could not parse @Component() metadata',
      options.filePath,
    );
    const parseResult: any = parser.parseForESLint(code, options);
    parseResult.services.defineTemplateBodyVisitor = () => {
      console.log('137');
      return {};
    };
    parseResult.services.convertNodeSourceSpanToLoc = () => {};
    return parseResult;
  }
}

export default {
  parseForESLint,
  parse: function parse(code: string, options: AngularESLintParserOptions) {
    return parseForESLint(code, options).ast;
  },
};
