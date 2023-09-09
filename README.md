# @paalan/cz-emoji

> Commitizen adapter formatting commit messages using emojis.

**@paalan/cz-emoji** allows you to easily use emojis in your commits using [commitizen].

```sh
? Select the type of change you are committing: (Use arrow keys)
❯ feature   🌟  A new feature
  fix       🐞  A bug fix
  docs      📚  Documentation change
  refactor  🎨  A code refactoring change
  chore     🔩  A chore change
```

## Install

**Globally**

```bash
npm install --global @paalan/cz-emoji

# set as default adapter for your projects
echo '{ "path": "@paalan/cz-emoji" }' > ~/.czrc
```

**Locally**

```bash
npm install --save-dev @paalan/cz-emoji
```

Add this to your `package.json`:

```json
"config": {
  "commitizen": {
    "path": "@paalan/cz-emoji"
  }
}
```

## Usage

```sh
$ git cz
```

## Customization

By default `@paalan/cz-emoji` comes ready to run out of the box. Uses may vary, so there are a few configuration options to allow fine tuning for project needs.

### How to

Configuring `@paalan/cz-emoji` can be handled in the users home directory (`~/.czrc`) for changes to impact all projects or on a per project basis (`package.json`). Simply add the config property as shown below to the existing object in either of the locations with your settings for override.

```json
{
  "config": {
    "@paalan/cz-emoji": {}
  }
}
```

### Configuration Options

#### Types

By default `@paalan/cz-emoji` comes preconfigured with the [Gitmoji](https://gitmoji.carloscuesta.me/) types.

An [Inquirer.js] choices array:

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "types": [
        {
          "emoji": "🌟",
          "code": ":star2:",
          "description": "A new feature",
          "name": "feature"
        }
      ]
    }
  }
}
```

#### Scopes

An [Inquirer.js] choices array:

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "scopes": ["home", "accounts", "ci"]
    }
  }
}
```

#### Emoji Symbol

A boolean value that allows for an using a unicode value rather than the default of [Gitmoji](https://gitmoji.carloscuesta.me/) markup in a commit message. The default for emojiSymbol is false.

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "emojiSymbol": true
    }
  }
}
```

#### Skip Questions

An array of questions you want to skip:

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "skipQuestions": ["scope", "issues"]
    }
  }
}
```

You can skip the following questions: `scope`, `body`, `issues`, and `breaking`. The `type` and `subject` questions are mandatory.

#### Customize Questions

An object that contains overrides of the original questions:

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "questions": {
        "body": "This will be displayed instead of original text"
      }
    }
  }
}
```

#### Customize the subject max length

The maximum length you want your subject has

```json
{
  "config": {
    "@paalan/cz-emoji": {
      "subjectMaxLength": 200
    }
  }
}
```

## Examples

- https://github.com/paalamugan/media-video-downloader

## Commitlint

Commitlint can be set to work with this package with the following configuration:

_commitlint.config.js_

```js
const pkg = require('./package.json');

// Check if the user has configured the package to use conventional commits.
const isConventional = pkg.config
  ? pkg.config['@paalan/cz-emoji']?.conventional
  : false;

// Regex for default and conventional commits.
const RE_DEFAULT_COMMIT =
  /^(?::.*:|(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))\s(?<emoji>\((?<scope>.*)\)\s)?.*$/gm;
const RE_CONVENTIONAL_COMMIT =
  /^^(?<type>\w+)(?:\((?<scope>\w+)\))?\s(?<emoji>:.*:|(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))\s.*$/gm;

module.exports = {
  rules: {
    '@paalan/cz-emoji': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        '@paalan/cz-emoji': ({ raw }) => {
          const isValid = isConventional
            ? RE_CONVENTIONAL_COMMIT.test(raw)
            : RE_DEFAULT_COMMIT.test(raw);

          const message = isConventional
            ? `Your commit message should follow conventional commit format.`
            : `Your commit message should be: <emoji> (<scope>)?: <subject>`;

          return [isValid, message];
        },
      },
    },
  ],
};
```

_Let me know if you are interested in having the above configuration published
as a `commitlint` plugin._

## License

MIT © [Paalamugan](https://paalamugan.com)

[commitizen]: https://github.com/commitizen/cz-cli
[inquirer.js]: https://github.com/SBoudrias/Inquirer.js/
