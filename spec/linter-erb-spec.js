'use babel';

import * as path from 'path';
import linter from '../lib/index';


describe('The ERB provider for Linter', () => {
  const { lint } = linter.provideLinter();

  beforeEach(() => {
    atom.workspace.destroyActivePaneItem();
    const activationPromise = atom.packages.activatePackage('linter-erb');

    waitsForPromise(() =>
      atom.packages.activatePackage('language-ruby'));

    waitsForPromise(() =>
      atom.workspace.open(path.join(__dirname, 'fixtures', 'good.html.erb')));

    atom.packages.triggerDeferredActivationHooks();
    waitsForPromise(() =>
      activationPromise);
  });

  it('should be in the packages list', () =>
    expect(atom.packages.isPackageLoaded('linter-erb')).toBe(true));

  it('should be an active package', () =>
    expect(atom.packages.isPackageActive('linter-erb')).toBe(true));

  describe('checks a file with issues and', () => {
    let editor = null;
    const badFile = path.join(__dirname, 'fixtures', 'bad.html.erb');
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(badFile).then((openEditor) => {
          editor = openEditor;
        }));
    });

    it('finds at least one message', () => {
      waitsForPromise(() =>
        lint(editor).then((messages) => {
          expect(messages.length).toBeGreaterThan(0);
        }));
    });

    it('verifies the first message', () => {
      waitsForPromise(() => {
        const messageText = 'unexpected keyword_in, expecting end-of-input';
        return lint(editor).then((messages) => {
          expect(messages[0].type).toBe('Error');
          expect(messages[0].html).not.toBeDefined();
          expect(messages[0].text).toBe(messageText);
          expect(messages[0].filePath).toBe(badFile);
          expect(messages[0].range).toEqual([[0, 0], [0, 32]]);
        });
      });
    });
  });

  it('finds nothing wrong with a file with rails type blocks', () => {
    waitsForPromise(() => {
      const blocksFile = path.join(__dirname, 'fixtures', 'rails_blocks.html.erb');
      return atom.workspace.open(blocksFile).then(editor =>
        lint(editor).then((messages) => {
          expect(messages.length).toBe(0);
        }));
    });
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() => {
      const goodFile = path.join(__dirname, 'fixtures', 'good.erb');
      return atom.workspace.open(goodFile).then(editor =>
        lint(editor).then((messages) => {
          expect(messages.length).toBe(0);
        }));
    });
  });
});
