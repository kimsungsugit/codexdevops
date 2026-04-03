import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToast = vi.fn();
const mockCfg = {
  baseUrl: 'http://jenkins:8080',
  username: '',
  token: '',
  cacheRoot: '.cache',
  buildSelector: 'lastSuccessfulBuild',
  verifyTls: true,
};

vi.mock('../App.jsx', () => ({
  useJenkinsCfg: () => ({ cfg: mockCfg, update: vi.fn() }),
  useToast: () => mockToast,
}));

vi.mock('../api.js', () => ({
  post: vi.fn().mockResolvedValue([]),
  defaultCacheRoot: () => '.devops_pro_cache/test',
  buildTone: (result) => {
    if (result === 'SUCCESS') return 'success';
    if (result === 'FAILURE') return 'danger';
    return 'neutral';
  },
}));

import BuildInfoSection from '../components/sections/BuildInfoSection.jsx';

const mockJob = {
  url: 'http://jenkins:8080/job/my-project/',
  name: 'my-project',
};

describe('BuildInfoSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with null analysisResult', () => {
    const { container } = render(<BuildInfoSection job={mockJob} analysisResult={null} />);
    expect(container).toBeTruthy();
  });

  it('renders base panels and action buttons without auto-loading', () => {
    const { container } = render(<BuildInfoSection job={mockJob} analysisResult={null} />);
    expect(container.querySelectorAll('.panel')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '불러오기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그 보기' })).toBeInTheDocument();
  });

  it('displays build details when reportData exists', () => {
    const analysisResult = {
      reportData: {
        build_number: 25,
        result: 'SUCCESS',
        branch: 'main',
        commit: 'abc1234',
        timestamp: 1711929600000,
      },
    };
    render(<BuildInfoSection job={mockJob} analysisResult={analysisResult} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getAllByText('SUCCESS').length).toBeGreaterThan(0);
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('abc1234')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://jenkins:8080/job/my-project/25/');
  });

  it('displays build steps when available', () => {
    const analysisResult = {
      reportData: {
        build_number: 25,
        result: 'SUCCESS',
        kpis: {
          build: {
            steps: [
              { name: 'Checkout', status: 'SUCCESS', duration: 5000 },
              { name: 'Build', status: 'SUCCESS', duration: 120000 },
              { name: 'Test', status: 'SUCCESS', duration: 60000 },
            ],
          },
        },
      },
    };
    const { container } = render(<BuildInfoSection job={mockJob} analysisResult={analysisResult} />);
    expect(container.querySelectorAll('.pipeline-step')).toHaveLength(3);
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
