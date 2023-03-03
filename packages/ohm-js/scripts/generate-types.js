import fs from 'fs';
import * as ohm from 'ohm-js';
import prettier from 'prettier';
import {fileURLToPath, URL} from 'url';

// Direct import from the @ohm-js/cli package!
// We do this to avoid a circular dependency between @ohm-js/cli and ohm-js.
import {getActionDecls} from '../../cli/src/helpers/generateTypes.js';

/*
  This script uses the internals of @ohm-js/cli to generate portions of Ohm's
  main TypeScript declarations (index.d.ts).
 */

const templatePath = new URL('./data/index.d.ts.template', import.meta.url);
const doNotEditBanner =
  '// DO NOT EDIT! This file is autogenerated from scripts/data/index.d.ts.template.\n';

// Renders a very simple Mustache-style template, with variables like
// `{{varName}}` and comments like `{{! This is a comment. }}`
const render = (template, vars) =>
  template.replace(/{{([^{}]*)}}/g, (_, name) => {
    if (name.trim().startsWith('!')) return ''; // Comment
    return vars[name]; // Variable substitution.
  });

(async function main() {
  // Get the BuiltInRules grammar and generate the types.
  const BuiltInRules = ohm.ohmGrammar.superGrammar;
  const builtInRuleActions = ['', ...getActionDecls(BuiltInRules)].join('\n    ');

  // Render index.d.ts from the template, overwriting the existing file contents.
  const template = await fs.promises.readFile(templatePath, 'utf-8');
  const output = render(template, {
    builtInRuleActions,
    doNotEditBanner,
  });
  const options = await prettier.resolveConfig(fileURLToPath(templatePath));
  const formattedOutput = prettier.format(output, {
    ...options,
    parser: 'typescript',
  });
  await fs.promises.writeFile(
      new URL('../index.d.ts', import.meta.url),
      formattedOutput,
      'utf-8',
  );
})();
