import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToast = vi.fn();
const mockCfg = {
  baseUrl: 'http://jenkins:8080',
  username: 'admin',
  token: 'token',
  cacheRoot: '.cache',
  buildSelector: 'lastSuccessfulBuild',
};

vi.mock('../App.jsx', () => ({
  useJenkinsCfg: () => ({ cfg: mockCfg, update: vi.fn() }),
  useToast: () => mockToast,
}));

vi.mock('../api.js', () => ({
  post: vi.fn().mockResolvedValue({}),
  defaultCacheRoot: () => '.devops_pro_cache/test',
  buildTone: () => 'neutral',
}));

import { post } from '../api.js';
import ScmSection from '../components/sections/ScmSection.jsx';

const mockJob = {
  url: 'http://jenkins:8080/job/my-project/',
  name: 'my-project',
};

describe('ScmSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with no SCM list', () => {
    const { container } = render(<ScmSection job={mockJob} analysisResult={{ scmList: [] }} />);
    expect(container).toBeTruthy();
  });

  it('shows empty state when no SCM is registered', () => {
    const { container } = render(<ScmSection job={mockJob} analysisResult={{ scmList: [] }} />);
    expect(container.querySelector('.empty-state')).toBeTruthy();
  });

  it('renders SCM info when scmList has entries', () => {
    const analysisResult = {
      scmList: [
        {
          id: 'proj1',
          name: 'My Project',
          scm_type: 'git',
          scm_url: 'https://github.com/org/repo.git',
          branch: 'main',
          source_root: '/src',
          linked_docs: {},
        },
      ],
    };
    render(<ScmSection job={mockJob} analysisResult={analysisResult} />);
    expect(screen.getByText(/My Project/)).toBeInTheDocument();
    expect(screen.getByText('GIT')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/org/repo.git')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('shows action buttons for SCM info and source root', () => {
    const analysisResult = {
      scmList: [
        {
          id: 'proj1',
          name: 'My Project',
          scm_type: 'git',
          scm_url: 'https://github.com/org/repo.git',
          linked_docs: {},
        },
      ],
    };
    const { container } = render(<ScmSection job={mockJob} analysisResult={analysisResult} />);
    expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });

  it('displays linked docs when present', async () => {
    const analysisResult = {
      scmList: [
        {
          id: 'proj1',
          name: 'My Project',
          scm_type: 'git',
          scm_url: 'https://github.com/org/repo.git',
          linked_docs: {
            srs: '/docs/SRS_v1.docx',
            sds: '/docs/SDS_v1.docx',
          },
        },
      ],
    };
    render(<ScmSection job={mockJob} analysisResult={analysisResult} />);
    expect(screen.getByText('SRS')).toBeInTheDocument();
    expect(screen.getByText('SDS')).toBeInTheDocument();
    await waitFor(() => expect(post).toHaveBeenCalled());
  });

  it('shows SCM selector when multiple SCMs exist', () => {
    const analysisResult = {
      scmList: [
        { id: 'proj1', name: 'Project A', scm_type: 'git', scm_url: '', linked_docs: {} },
        { id: 'proj2', name: 'Project B', scm_type: 'svn', scm_url: '', linked_docs: {} },
      ],
    };
    render(<ScmSection job={mockJob} analysisResult={analysisResult} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays changed files when impactData has changed_files', () => {
    const analysisResult = {
      scmList: [{ id: 'proj1', name: 'Project', scm_type: 'git', scm_url: '', linked_docs: {} }],
      impactData: {
        changed_files: ['src/main.c', 'src/util.c', 'include/util.h'],
      },
    };
    render(<ScmSection job={mockJob} analysisResult={analysisResult} />);
    expect(screen.getByText('src/main.c')).toBeInTheDocument();
  });
});
