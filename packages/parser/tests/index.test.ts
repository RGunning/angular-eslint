import parser, { AngularESLintParserOptions } from '../src/index';

describe('parser', () => {
  describe('parserForESLint()', () => {
    const tests: { code: string; options: AngularESLintParserOptions }[] = [
      {
        options: {
          filePath: 'app.component.html',
          sourceType: 'module',
        },
        code: `
          <input type="text" name="foo" ([ngModel])="foo">
        `,
      },
      {
        options: {
          filePath: 'example.component.ts',
          sourceType: 'module',
        },
        code: `
          import { Component, OnInit, Output, EventEmitter } from '@angular/core';

          @Component({
            selector: 'app-example',
            template: \`
              <input type="text" name="foo" ([ngModel])="foo">

              <app-item ([bar])="bar" ([item])="item" [(test)]="test"></app-item>
              <div [oneWay]="oneWay" (emitter)="emitter" ([twoWay])="twoWay"></div>
            \`,
            styleUrls: ['./example.component.scss'],
            inputs: [],
            outputs: [],
            host: {}
          })
          export class ExampleComponent implements OnInit {

            @Output() onFoo = new EventEmitter();

            constructor() { }

            ngOnInit() {
            }

          }

        `,
      },
    ];

    tests.forEach((tc, i) => {
      it(`should work ${i}`, () => {
        expect(parser.parseForESLint(tc.code, tc.options)).toMatchSnapshot();
      });
    });
  });
});
