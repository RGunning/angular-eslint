import rule, { MessageIds, RULE_NAME } from '../../src/rules/banana-in-a-box';
import {
  convertAnnotatedSourceToFailureCase,
  RuleTester,
} from '../test-helper';

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();
const messageId: MessageIds = 'bananaInABox';

ruleTester.run(RULE_NAME, rule, {
  valid: [
    `<input type="text" name="foo" [ngModel]="foo">`,
    `<input type="text" name="foo" [(ngModel)]="foo">`,
    `
      <button type="button" (click)="navigate(['/resources'])">
        Navigate
      </button>
    `,
  ],
  invalid: [
    convertAnnotatedSourceToFailureCase({
      description:
        'it should fail if the parens and square brackets are reversed',
      annotatedSource: `
        <input type="text" name="foo" ([ngModel])="foo">
                                      ~~~~~~~~~~~~~~~~~
      `,
      messageId,
      annotatedOutput: `
        <input type="text" name="foo" [(ngModel)]="foo">
                                      ~~~~~~~~~~~~~~~~~
      `,
    }),
    convertAnnotatedSourceToFailureCase({
      filename: 'example.component.ts',
      description:
        'it should fail if the parens and square brackets are reversed in an inline template',
      annotatedSource: `
        @Component({
          selector: 'app-example',
          template: '<input type="text" name="foo" ([ngModel])="foo">'
                                                   ~~~~~~~~~~~~~~~~~
        })
        export class ExampleComponent {}
      `,
      messageId,
      annotatedOutput: `
        @Component({
          selector: 'app-example',
          template: '<input type="text" name="foo" [(ngModel)]="foo">'
                                                   ~~~~~~~~~~~~~~~~~
        })
        export class ExampleComponent {}
      `,
    }),
    {
      code: `
        <app-item ([bar])="bar" ([item])="item" [(test)]="test"></app-item>
        <div [baz]="oneWay" (emitter)="emitter" ([twoWay])="twoWay"></div>
      `,
      errors: [
        {
          messageId,
          line: 2,
          column: 19,
        },
        {
          messageId,
          line: 2,
          column: 33,
        },
        {
          messageId,
          line: 3,
          column: 49,
        },
      ],
      output: `
        <app-item [(bar)]="bar" [(item)]="item" [(test)]="test"></app-item>
        <div [baz]="oneWay" (emitter)="emitter" [(twoWay)]="twoWay"></div>
      `,
    },
  ],
});
