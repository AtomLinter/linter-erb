'use babel';

import path from 'path';
import { CompositeDisposable } from 'atom';

export default {
  config: {
    erbExecutablePath: {
      description: 'Path to the `erb` executable',
      type: 'string',
      default: 'erb'
    },
    trimMode: {
      description: 'What trim mode ERB should use',
      type: 'string',
      enum: ['None', '0', '1', '2', '-'],
      default: 'None'
    },
    rubyExecutablePath: {
      description: 'Path to the `ruby` executable',
      type: 'string',
      default: 'ruby'
    }
  },

  activate() {
    require('atom-package-deps').install();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-erb.erbExecutablePath', erbExecutablePath => {
        this.erbCommand = erbExecutablePath;
      })
    );
    this.subscriptions.add(
      atom.config.observe('linter-erb.trimMode', trimMode => {
        this.trimMode = trimMode;
      })
    );
    this.subscriptions.add(
      atom.config.observe('linter-erb.rubyExecutablePath', rubyExecutablePath => {
        this.rubyCommand = rubyExecutablePath;
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'ERB',
      grammarScopes: ['text.html.erb', 'text.html.ruby'],
      scope: 'file',
      lintOnFly: true,
      lint: textEditor => {
        const helpers = require('atom-linter');
        const filePath = textEditor.getPath();
        const fileDir = path.dirname(filePath);
        const text = textEditor.getText();
        const erbArgs = ['-x'];
        const rubyArgs = ['-c', '-'];

        if (!text) {
          return Promise.resolve([]);
        }

        // Specify the trim mode, if needed
        if (this.trimMode !== 'None') {
          erbArgs.concat('-T', this.trimMode);
        }
        erbArgs.concat('-');

        // Call ERB to "de-templatize" the code
        return helpers.exec(this.erbCommand, erbArgs,
          { stdin: text, cwd: fileDir }
        ).then(erbOut => {
          let rubyCode = erbOut;
          // Deal with the <%= function_with trailing block do %> ... <% end %>
          // From Ruby on Rails code
          const scopes = textEditor.getLastCursor().getScopeDescriptor().scopes;
          if (scopes.indexOf('text.html.ruby') !== -1) {
            rubyCode = erbOut.replace(/_erbout.concat\(\((.+?do.+?)\).to_s\)/g, '\$1');
          }
          // Run Ruby on the "de-templatized" code
          const rubyProcessOpt = { stdin: rubyCode, stream: 'stderr' };
          return helpers.exec(this.rubyCommand, rubyArgs, rubyProcessOpt).then(output => {
            const regex = /.+:(\d+):\s+(?:.+?)[,:]\s(.+)/g;
            const messages = [];
            let match = regex.exec(output);
            while (match !== null) {
              // Bump line number down due to inserted extra line
              match[1] = match[1] - 1;
              messages.push({
                type: 'Error',
                text: match[2],
                filePath,
                range: helpers.rangeFromLineNumber(textEditor, match[1] - 1)
              });
              match = regex.exec(output);
            }
            return messages;
          });
        });
      }
    };
  }
};
