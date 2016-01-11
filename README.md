# linter-erb

This package will lint your `.erb` opened files in Atom through [erb -x](http://www.ruby-lang.org/).

## Installation

### Ruby

Before using this package you will need to have [Ruby][] installed and
available from your `$PATH`.

### Plugin installation

The [Linter][] and package will be installed for you to provide an interface
to this package. If you are using an alternative debugging interface that
supports linter plugins simply disable [Linter][].

If you do not already have it installed, [language-ruby][] will also be
installed for you.

To install this packge either search for it from within Atom's settings menu
or run the following command.

```ShellSession
apm install linter-bootlint
```

## Settings

All of linter-erb's settings are available from within Atom's settings menu.
If you prefer to manually edit the configuration file the following settings
are available:

*   `executablePath`: Defaults to `erb`, allowing the `$PATH` to resolve the
    correct location. If you need to override this specify the full path to
    `erb`. For example `/usr/bin/erb` on Linux or `C:\Ruby22\bin\erb` on
    Windows. If you are unsure of the location on your system type either
    `which erb` on UNIX based systems, or `where.exe erb` on Windows.

[linter]: https://github.com/atom-community/linter "Linter"
[language-ruby]: https://github.com/atom/language-ruby "language-ruby"
[ruby]: http://www.ruby-lang.org/ "Ruby"
