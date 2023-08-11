import { execSync, spawnSync } from 'node:child_process'

import { dim } from 'colorette'

function useExecSync(command: string) {
  return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
}

export function checkInstall() {
  try {
    useExecSync('git --version')

    return true
  } catch {
    return false
  }
}

export function checkInsideRepo() {
  try {
    useExecSync('git rev-parse --is-inside-work-tree')

    return true
  } catch {
    return false
  }
}

export function initializeRepo(branchName: string) {
  try {
    useExecSync(`git init -b ${branchName}`)

    return true
  } catch {
    return false
  }
}

export function stageFiles(files: string | string[] = '.') {
  try {
    if (Array.isArray(files)) {
      files = files.join(' ')
    }

    useExecSync(`git add ${files}`)

    return true
  } catch {
    return false
  }
}

export function commit(message: string) {
  try {
    const commitProcess = spawnSync('git', ['commit', '-F', '-'], {
      encoding: 'utf8',
      input: message,
      stdio: ['pipe', 'pipe', 'ignore']
    })

    if (commitProcess.status === 0) {
      return true
    }

    return false
  } catch {
    return false
  }
}

export function getBranchName() {
  try {
    return useExecSync('git symbolic-ref --short HEAD')
  } catch {
    return undefined
  }
}

export function getUntrackedFiles() {
  try {
    const files = useExecSync('git ls-files --others --exclude-standard').split('\n')

    return files.filter((item) => item.trim() !== '').map((item) => ({ file: item, status: '?' }))
  } catch {
    return []
  }
}

export function getUnstagedFiles() {
  try {
    const files = useExecSync('git diff --no-ext-diff --name-status').split('\n')

    return files.filter((item) => item.trim() !== '').map((item) => {
      const [status, file] = item.split('\t')

      return { file: file!, status: status! }
    })
  } catch {
    return []
  }
}

export function getStagedFiles() {
  try {
    const files = useExecSync('git diff --no-ext-diff --name-status --cached').split('\n')

    return files.filter((item) => item.trim() !== '').map((item) => {
      const [status, file] = item.split('\t')

      return { file: file!, status: status! }
    })
  } catch {
    return []
  }
}

export function getCommitCount() {
  try {
    return Number.parseInt(useExecSync('git rev-list --count HEAD'))
  } catch {
    return 0
  }
}

export function formatFilesOutput(
  files: {
    file: string
    status: string
  }[],
  colCount = 3
) {
  let result = ''
  let maxLength = 0

  const rowCount = Math.ceil(files.length / colCount)

  for (const file of files) {
    maxLength = Math.max(maxLength, file.file.length)
  }

  const colWidth = maxLength + 2

  for (let row = 0; row < rowCount; row++) {
    let rowContent = ''

    for (let col = 0; col < colCount; col++) {
      const index = col * rowCount + row

      if (index < files.length) {
        const fileName = files[index]?.file
        const fileStatus = files[index]?.status
        const content = `${fileStatus} ${fileName}`

        rowContent += content.padEnd(colWidth)
      }
    }

    result += dim(rowContent) + '\n'
  }

  return result.trimEnd()
}

export function getGitRootPath() {
  try {
    return useExecSync('git rev-parse --show-toplevel')
  } catch {
    return undefined
  }
}

export function getGitDirPath() {
  try {
    return useExecSync('git rev-parse --absolute-git-dir')
  } catch {
    return undefined
  }
}

export function getTags() {
  try {
    return useExecSync('git rev-parse --symbolic --tags').split('\n')
  } catch {
    return []
  }
}
