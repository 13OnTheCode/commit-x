/* eslint-disable perfectionist/sort-objects */
import { exit } from 'node:process'

import { cancel, confirm, group, intro, log, multiselect, outro, select, text } from '@clack/prompts'
import { bgCyan, black, cyan, dim, green, red, yellow } from 'colorette'

import { prettyError } from './error'
import { checkInsideRepo, checkInstall, commit, formatFilesOutput, getBranchName, getStagedFiles, getUnstagedFiles, getUntrackedFiles, initializeRepo, stageFiles } from './git'

function terminalClear() {
  // eslint-disable-next-line no-console
  console.log('\u001B[2J\u001B[0f')
}

function handleExit(
  options: {
    exitCode?: number
    isCancel?: boolean
    messages?: string | string[]
  } = {}
): never {
  const { exitCode = 0, messages = '', isCancel = false } = options

  const messagesEntries = [messages].flat().filter((item) => typeof item === 'string' && item.trim() !== '').entries()

  for (const [index, value] of messagesEntries) {
    const handle = index === 0 ? log.error : log.message
    handle(red(value))
  }

  isCancel ? cancel('Operation cancelled') : outro(red('Operation terminated'))

  exit(exitCode)
}

interface CommitData {
  body: string
  breaking: string
  closedIssue: string
  scope: string
  subject: string
  type: string
}

function generateCommitMessage(
  commitData: CommitData
) {
  const { type, scope, subject, body, breaking, closedIssue } = commitData
  let message = type

  if (scope) {
    message += `(${scope})`
  }

  if (breaking) {
    message += '!'
  }

  message += `: ${subject}`

  if (body) {
    message += `\n\n${body.replaceAll('|', '\n')}`
  }

  if (breaking) {
    message += `\n\nBREAKING CHANGE: ${breaking}`
  }

  if (closedIssue) {
    message += `\n\nclosed: ${closedIssue}`
  }

  return message
}

async function shouldContinuePrompt<T>(
  options: {
    answers: (shouldContinue: boolean) => Promise<T>
    initialValue?: boolean
    message: string
  }
) {
  const { answers, message, initialValue } = options

  const { handleAnswers } = await group(
    {
      shouldContinue: () => confirm({ message, initialValue }),
      handleAnswers: ({ results }) => answers(results.shouldContinue as boolean)
    },
    {
      onCancel: () => handleExit({ isCancel: true })
    }
  )

  return handleAnswers
}

async function commitDataPrompt() {
  const answers = await group(
    {
      type: () => select<{
        hint?: string
        label?: string
        value: string;
      }[], string>({
        message: 'Select the type of change:',
        options: [
          { value: 'feat', hint: 'A new feature' },
          { value: 'fix', hint: 'A bug fix' },
          { value: 'docs', hint: 'Documentation only changes' },
          { value: 'style', hint: 'Changes that do not affect the meaning of the code' },
          { value: 'refactor', hint: 'A code change that neither fixes a bug nor adds a feature' },
          { value: 'test', hint: 'Adding missing tests or correcting existing tests' },
          { value: 'perf', hint: 'A code change that improves performance' },
          { value: 'ci', hint: 'Changes to our CI configuration files and scripts' },
          { value: 'build', hint: 'Changes that affect the build system or external dependencies' },
          { value: 'chore', hint: 'Other changes that don\'t modify src or test files' },
          { value: 'revert', hint: 'Reverts a previous commit' }
        ]
      }),
      scope: () => shouldContinuePrompt({
        message: 'Do you need to fill out the scope of change?',
        initialValue: false,
        answers: (shouldContinue) => shouldContinue ? text({
          message: 'Fill in the scope of change:',
          validate: (value) => value.length === 0 ? 'Value is required!' : undefined
        }) : Promise.resolve('')
      }),
      subject: () => text({
        message: 'Fill in the description subject of change:',
        validate: (value) => {
          if (value.length === 0) {
            return 'Value is required'
          }

          if (value.length > 50) {
            return `Please make sure it does not exceed 50 characters, currently ${value.length} characters`
          }

          return undefined
        }
      }),
      body: () => shouldContinuePrompt({
        message: 'Do you need to fill out the description body of change?',
        initialValue: false,
        answers: (shouldContinue) => shouldContinue ? text({
          message: `Fill in the description body of change: ${dim('Use "|" to break new line')}`,
          validate: (value) => value.length === 0 ? 'Value is required!' : undefined
        }) : Promise.resolve('')
      }),
      breaking: () => shouldContinuePrompt({
        message: 'Does this commit introduce any breaking changes?',
        initialValue: false,
        answers: (shouldContinue) => shouldContinue ? text({
          message: 'Fill in the breaking changes:',
          validate: (value) => value.length === 0 ? 'Value is required!' : undefined
        }) : Promise.resolve('')
      }),
      closedIssue: () => shouldContinuePrompt({
        message: 'Does this commit address any issues that need to be closed?',
        initialValue: false,
        answers: (shouldContinue) => shouldContinue ? text({
          message: `Fill in #ISSUE: ${dim('For example: #31, #34')}`,
          validate: (value) => value.length === 0 ? 'Value is required!' : undefined
        }) : Promise.resolve('')
      })
    },
    {
      onCancel: () => handleExit({ isCancel: true })
    }
  )

  return answers as CommitData
}

async function run() {
  terminalClear()

  intro(bgCyan(black(' Commit-X ')))

  if (!checkInstall()) {
    handleExit({
      messages: [
        'Git is not installed, Please download and install it before trying again',
        'You can download it from here: https://git-scm.com'
      ]
    })
  }

  if (!checkInsideRepo()) {
    log.warn(yellow('There is no Git repository in the current directory (or any of the parent directories)'))

    const branchName = await shouldContinuePrompt({
      message: 'Do you want to initialize a Git repository?',
      answers: (shouldContinue) => {
        !shouldContinue && handleExit()

        return select({
          message: 'Pick a branch name:',
          options: [
            { value: 'main', label: 'main' },
            { value: 'master', label: 'master' }
          ]
        })
      }
    })

    if (typeof branchName === 'string') {
      initializeRepo(branchName)
      log.success(green('Git repository initialized successfully'))
    } else {
      handleExit()
    }
  }

  const branchName = getBranchName()
  const stagedFiles = getStagedFiles()
  const unstagedFiles = [...getUntrackedFiles(), ...getUnstagedFiles()]
  const changesCount = unstagedFiles.length + stagedFiles.length

  if (changesCount === 0) {
    handleExit({
      messages: [
        `No changes on branch "${branchName}", no need to commit`,
        'Please make sure you are on the correct branch before making any commits'
      ]
    })
  }

  if (typeof branchName === 'string') {
    log.message(cyan('Branch'))
    log.message(dim(branchName))
  }

  if (unstagedFiles.length > 0) {
    log.message(cyan('Unstaged Files'))
    log.message(formatFilesOutput(unstagedFiles, 1))
  }

  if (stagedFiles.length > 0) {
    log.message(cyan('Staged Files'))
    log.message(formatFilesOutput(stagedFiles, 1))
  }

  const needStageFiles: {
    file: string
    status: string
  }[] = []

  if (unstagedFiles.length > 0) {
    if (stagedFiles.length === 0) {
      log.warn(yellow('Staged files are empty, but unstaged files present'))
    }

    if (stagedFiles.length > 0) {
      log.warn(yellow('Unstaged files detected'))
      log.message(yellow('Please make sure you haven\'t forgotten them before committing'))
    }

    const selectUnstagedFiles = await shouldContinuePrompt({
      message: 'Do you want to select unstaged files to include them in what will be committed?',
      answers: (shouldContinue) => {
        if (stagedFiles.length === 0 && !shouldContinue) {
          handleExit({
            messages: [
              'No files to commit',
              'Please stage the files before committing'
            ]
          })
        }

        return shouldContinue ? multiselect({
          message: `Select unstaged files: ${dim('Press "a" key to select/deselect all')}`,
          options: unstagedFiles.map(({ file, status }) => ({ value: { file, status }, label: `${status} ${file}` })),
          required: true
        }) : Promise.resolve([])
      }
    })

    needStageFiles.push(...selectUnstagedFiles as {
      file: string
      status: string
    }[])
  }

  const commitData = await commitDataPrompt()

  const commitMessage = generateCommitMessage(commitData)

  const commitFiles = [...stagedFiles, ...needStageFiles]

  log.message(cyan('Commit Files'))
  log.message(formatFilesOutput(commitFiles, 1))

  log.message(cyan('Commit Message'))
  log.message(commitMessage.split('\n').map((line) => dim(line)).join('\n'))

  await shouldContinuePrompt({
    message: 'Are you sure you want to proceed with the commit above?',
    answers: (shouldContinue) => {
      !shouldContinue && handleExit()

      stageFiles(needStageFiles.map((item) => item.file)) && commit(commitMessage)
        ? outro(green('Success'))
        : outro(red('Failure'))

      return Promise.resolve(true)
    }
  })
}

try {
  await run()
} catch (error) {
  handleExit({
    messages: error instanceof Error ? prettyError(error) : 'unknown error'
  })
}
