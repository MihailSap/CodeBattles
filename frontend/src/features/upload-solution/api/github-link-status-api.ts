import { httpClient } from '@/shared/api';

interface GithubLinkStatus {
  githubLogin: string;
}

export interface GithubPullRequestOption {
  title: string;
  url: string;
  number: number;
}

const isGithubLinkStatus = (value: unknown): value is GithubLinkStatus =>
  typeof value === 'object' && value !== null && 'githubLogin' in value && typeof value.githubLogin === 'string';

const isGithubPullRequestOption = (value: unknown): value is GithubPullRequestOption =>
  typeof value === 'object' &&
  value !== null &&
  'title' in value &&
  typeof value.title === 'string' &&
  'url' in value &&
  typeof value.url === 'string' &&
  'number' in value &&
  typeof value.number === 'number';

export const githubLinkStatusApi = {
  async getLogin(): Promise<string> {
    const response = await httpClient.get<unknown>('/api/v1/profile/me/linked-accounts');

    return isGithubLinkStatus(response.data) ? response.data.githubLogin : '';
  },
  async getOpenPullRequests(): Promise<GithubPullRequestOption[]> {
    const response = await httpClient.get<unknown>('/api/v1/solutions/github/pull-requests');

    return Array.isArray(response.data) ? response.data.filter(isGithubPullRequestOption) : [];
  },
};
