'use babel';

// eslint-disable-next-line no-unused-vars
import { it, fit, wait, beforeEach, afterEach } from 'jasmine-fix';
import * as path from 'path';
import linter from '../lib/index';


describe('The ERB provider for Linter', () => {
  const { lint } = linter.provideLinter();

  beforeEach(async () => {
    atom.workspace.destroyActivePaneItem();
    const activationPromise = atom.packages.activatePackage('linter-erb');

    await atom.packages.activatePackage('language-ruby');

    await atom.workspace.open(path.join(__dirname, 'fixtures', 'good.html.erb'));

    atom.packages.triggerDeferredActivationHooks();
    await activationPromise;
  });

  it('should be in the packages list', () => {
    expect(atom.packages.isPackageLoaded('linter-erb')).toBe(true);
  });

  it('should be an active package', () => {
    expect(atom.packages.isPackageActive('linter-erb')).toBe(true);
  });

  it('returns the expected messages for a file with issues', async () => {
    const badFile = path.join(__dirname, 'fixtures', 'bad.html.erb');
    const messageText = 'unexpected keyword_in, expecting end-of-input';
    const editor = await atom.workspace.open(badFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('Error');
    expect(messages[0].html).not.toBeDefined();
    expect(messages[0].text).toBe(messageText);
    expect(messages[0].filePath).toBe(badFile);
    expect(messages[0].range).toEqual([[0, 0], [0, 32]]);
  });

  it('finds nothing wrong with a file with rails type blocks', async () => {
    const blocksFile = path.join(__dirname, 'fixtures', 'rails_blocks.html.erb');
    const editor = await atom.workspace.open(blocksFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });

  it('finds nothing wrong with a valid file', async () => {
    const goodFile = path.join(__dirname, 'fixtures', 'good.erb');
    const editor = await atom.workspace.open(goodFile);
    const messages = await lint(editor);

    expect(messages.length).toBe(0);
  });
});
