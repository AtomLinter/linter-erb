'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';

// Dependencies
let helpers;
let path;

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter');
  }
  if (!path) {
    path = require('path');
  }
};

export default {
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installLinterErbDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-erb');
      }
      loadDeps();
    };
    depsCallbackID = window.requestIdleCallback(installLinterErbDeps);
    this.idleCallbacks.add(depsCallbackID);

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-erb.erbExecutablePath', (erbExecutablePath) => {
        this.erbPath = erbExecutablePath;
      }),
      atom.config.observe('linter-erb.trimMode', (trimMode) => {
        this.trimMode = trimMode;
      }),
      atom.config.observe('linter-erb.rubyExecutablePath', (rubyExecutablePath) => {
        this.rubyPath = rubyExecutablePath;
      }),
    );
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'ERB',
      grammarScopes: ['text.html.erb', 'text.html.ruby'],
      scope: 'file',
      lintOnFly: true,
      lint: async (textEditor) => {
        loadDeps();
        const filePath = textEditor.getPath();
        if (!filePath) {
          // Provided TextEditor has no path associated with it
          return [];
        }
        const fileDir = path.dirname(filePath);
        const text = textEditor.getText();
        const erbArgs = ['-x'];
        const rubyArgs = ['-c', '-'];

        if (!text) {
          return [];
        }

        // Specify the trim mode, if needed
        if (this.trimMode !== 'None') {
          erbArgs.push('-T', this.trimMode);
        }
        erbArgs.push('-');

        const execOpts = {
          stdin: text.replace(/<%=/g, '<%'),
          cwd: fileDir,
        };

        // Call ERB to "de-templatize" the code
        const erbOut = await helpers.exec(this.erbPath, erbArgs, execOpts);

        // Run Ruby on the "de-templatized" code
        const rubyProcessOpt = {
          stdin: erbOut,
          stream: 'stderr',
          allowEmptyStderr: true,
          cwd: fileDir,
        };

        const output = await helpers.exec(this.rubyPath, rubyArgs, rubyProcessOpt);

        const regex = /.+:(\d+):\s+(?:.+?)[,:]\s(.+)/g;
        const messages = [];
        let match = regex.exec(output);
        while (match !== null) {
          messages.push({
            type: 'Error',
            text: match[2],
            filePath,
            // Bump line number down 2 instead of 1 due to inserted extra line
            range: helpers.generateRange(textEditor, match[1] - 2),
          });
          match = regex.exec(output);
        }
        return messages;
      },
    };
  },
};
