import { findUp } from 'find-up';
import fs from 'fs/promises';
import truncate from 'cli-truncate';
import wrap from 'wrap-ansi';
import pad from 'pad';
import path from 'path';
import fuse from 'fuse.js';
import types from './constants/types';

interface Config {
  types: typeof types;
  emojiSymbol: boolean;
  skipQuestions: string[];
  subjectMaxLength: number;
  conventional: boolean;
  scopes?: { name: string; value: string }[];
  format: string;
  questions?: {
    type?: string;
    scope?: string;
    subject?: string;
    body?: string;
    breaking?: string;
    issues?: string;
  };
}

interface Answer {
  type: { emoji: string };
  scope: string;
  subject: string;
  body: string;
  breakingBody: string;
  issues: string;
}

interface Question {
  type: string;
  name: string;
  message: string;
  maxLength?: number;
  choices?: { name: string; value: string }[];
  when?: boolean;
  source?: (name: string, query: string) => Promise<unknown>;
}

interface Prompt {
  (questions: Question[]): Promise<Answer>;
  registerPrompt: (name: string, prompt: unknown) => void;
}
interface Commitizen {
  prompt: Prompt;
}

const loadConfig = async (filename: string | undefined) => {
  try {
    if (!filename) return null;
    const text = await fs.readFile(filename, 'utf8');
    const obj = await JSON.parse(text);
    return obj?.config?.['@paalan/cz-emoji'] as Config;
  } catch {
    return null;
  }
};

async function loadConfigUpwards(filename: string) {
  const filename_1 = await findUp(filename);
  return loadConfig(filename_1);
}

const getConfig = async () => {
  const defaultFormat = '{emoji} {scope} {subject}';
  const conventionalFormat = `{emoji} {type}{scope}: {subject}`;

  const defaultConfig = {
    types,
    emojiSymbol: false,
    skipQuestions: [''],
    subjectMaxLength: 75,
    conventional: true,
  };

  const loadedConfig =
    (await loadConfigUpwards('package.json')) ||
    (await loadConfigUpwards('.czrc')) ||
    (await loadConfig(path.join(process.cwd(), '.czrc'))) ||
    defaultConfig;

  const config: Config = {
    ...defaultConfig,
    ...loadedConfig,
    ...{
      format: loadedConfig.conventional ? conventionalFormat : defaultFormat,
    },
  };

  return config;
};

const getEmojiChoices = ({ types, emojiSymbol }: Config) => {
  const maxNameLength = types.reduce(
    (maxLength, type) =>
      type.name.length > maxLength ? type.name.length : maxLength,
    0
  );

  return types.map((choice) => ({
    name: `${pad(choice.name, maxNameLength)}  ${choice.emoji}  ${
      choice.description
    }`,
    value: {
      emoji: emojiSymbol ? `${choice.emoji} ` : choice.code,
      name: choice.name,
    },
    code: choice.code,
  }));
};

const formatIssues = (issues: string) => {
  return issues
    ? 'Closes ' + (issues.match(/#\d+/g) || []).join(', closes ')
    : '';
};

const createQuestions = (config: Config) => {
  const choices = getEmojiChoices(config);

  const fuzzy = new fuse(choices, {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
    keys: ['name', 'code'],
  });

  const questions: Question[] = [
    {
      type: 'autocomplete',
      name: 'type',
      message: config?.questions?.type
        ? config.questions.type
        : "Select the type of change you're committing:",
      source: (_name, query) =>
        Promise.resolve(query ? fuzzy.search(query) : choices),
    },
    {
      type: config.scopes ? 'list' : 'input',
      name: 'scope',
      message:
        config.questions && config.questions.scope
          ? config.questions.scope
          : 'Specify a scope:',
      choices:
        config.scopes && [{ name: '[none]', value: '' }].concat(config.scopes),
      when: !config.skipQuestions.includes('scope'),
    },
    {
      type: 'maxlength-input',
      name: 'subject',
      message:
        config.questions && config.questions.subject
          ? config.questions.subject
          : 'Write a short description:',
      maxLength: config.subjectMaxLength,
    },
    {
      type: 'input',
      name: 'body',
      message:
        config.questions && config.questions.body
          ? config.questions.body
          : 'Provide a longer description:',
      when: !config.skipQuestions.includes('body'),
    },
    {
      type: 'input',
      name: 'breakingBody',
      message:
        config.questions && config.questions.breaking
          ? config.questions.breaking
          : 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself:\n',
      when: !config.skipQuestions.includes('breaking'),
    },
    {
      type: 'input',
      name: 'issues',
      message:
        config.questions && config.questions.issues
          ? config.questions.issues
          : 'List any issue closed (#1, #2, ...):',
      when: !config.skipQuestions.includes('issues'),
    },
  ];

  return questions;
};

const formatCommitMessage = (answer: Answer, config: Config) => {
  const { columns } = process.stdout;

  const emoji = answer.type;
  const type = config.types.find((type) => type.emoji === emoji.emoji)?.name;
  const scope = answer.scope ? '(' + answer.scope.trim() + ')' : '';
  const subject = answer.subject.trim();

  const commitMessage = config.format
    .replace(/{emoji}/g, emoji.emoji)
    .replace(/{scope}/g, scope)
    .replace(/{subject}/g, subject)
    // Only allow at most one whitespace.
    // When an optional field (ie. `scope`) is not specified, it can leave several consecutive
    // white spaces in the final message.
    .replace(/\s+/g, ' ');

  if (type) {
    commitMessage.replace(/{type}/g, type);
  }

  const head = truncate(commitMessage, columns);
  const body = wrap(answer.body || '', columns);
  const breaking =
    answer.breakingBody && answer.breakingBody.trim().length !== 0
      ? wrap(`BREAKING CHANGE: ${answer.breakingBody.trim()}`, columns)
      : '';
  const footer = formatIssues(answer.issues);

  return [head, body, breaking, footer].filter(Boolean).join('\n\n').trim();
};

const promptCommitMessage = async (cz: Commitizen) => {
  const [inquiredAutocompletePrompt, inquirerMaxLengthInputPrompt] =
    await Promise.all([
      import('inquirer-autocomplete-prompt'),
      import('inquirer-maxlength-input-prompt'),
    ]);
  cz.prompt.registerPrompt('autocomplete', inquiredAutocompletePrompt);
  cz.prompt.registerPrompt('maxlength-input', inquirerMaxLengthInputPrompt);

  const config = await getConfig();
  const questions = createQuestions(config);
  const answers = await cz.prompt(questions);
  const message = formatCommitMessage(answers, config);

  return message;
};

export default {
  prompter: (cz: Commitizen, commit: (value: string) => void) => {
    promptCommitMessage(cz).then(commit);
  },
};
