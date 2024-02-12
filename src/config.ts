export const config: Config = {
  // "org/repo-name": {
  //   github_rule: "jira_webhook_id"
  // }
}

export interface Config {
  [key: string]: ActionGithub
}

export interface ActionGithub {
  pull_request_review_comment: string;
  [key: string]: string
}
