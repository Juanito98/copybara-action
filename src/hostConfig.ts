import { ensureFile, writeFile } from "fs-extra";
import { homedir } from "os";

export class hostConfig {
  static gitConfigPath = homedir() + "/.gitconfig";
  static sshKeyPath = homedir() + "/.ssh/id_rsa";
  static knownHostsPath = homedir() + "/.ssh/known_hosts";
  static cbConfigPath = homedir() + "/copy.bara.sky";

  // https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
  static githubKnownHost =
    "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=";

  static async saveGitConfig({ committer, accessToken }: { committer: string; accessToken: string }): Promise<void> {
    const match = committer.match(/^(.+)\s?<([^>]+)>/i);
    const committerName = match && match[1] ? match[1].trim() : "Github Actions";
    const committerEmail = match && match[2] ? match[2].trim() : "actions@github.com";

    return this.save(
      this.gitConfigPath,
      `
      [user]
          name = ${committerName}
          email = ${committerEmail}
      
      [url "https://${accessToken}:x-oauth-basic@github.com"]
	      insteadOf = https://github.com
      `,
    );
  }

  static async saveSshKey(sshKey: string): Promise<void> {
    return this.save(this.sshKeyPath, sshKey);
  }

  static async saveKnownHosts(knownHosts: string): Promise<void> {
    return this.save(this.knownHostsPath, `${this.githubKnownHost}\n${knownHosts}`);
  }

  static async saveCopybaraConfig(config: string): Promise<void> {
    return this.save(this.cbConfigPath, config);
  }

  static async save(file: string, content: string): Promise<void> {
    const filePath = file.replace("~", homedir());
    return ensureFile(filePath).then(() => writeFile(filePath, content));
  }
}
