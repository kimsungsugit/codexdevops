import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToast = vi.fn();
const mockCfg = {
  baseUrl: '',
  username: '',
  token: '',
  cacheRoot: '.cache',
  buildSelector: 'lastSuccessfulBuild',
  verifyTls: true,
};
const mockSetSelectedJob = vi.fn();
const mockSetAnalysisResult = vi.fn();

vi.mock('../App.jsx', () => ({
  useToast: () => mockToast,
  useJenkinsCfg: () => ({ cfg: mockCfg, update: vi.fn() }),
  useJob: () => ({
    selectedJob: null,
    setSelectedJob: mockSetSelectedJob,
    setAnalysisResult: mockSetAnalysisResult,
  }),
}));

vi.mock('../api.js', () => ({
  post: vi.fn().mockResolvedValue([]),
  api: vi.fn().mockResolvedValue({}),
  defaultCacheRoot: () => '.devops_pro_cache/test',
  colorTone: () => 'neutral',
  buildTone: () => 'neutral',
}));

vi.mock('../components/JobCard.jsx', () => ({
  default: ({ job, selected, onClick }) => (
    <div data-testid={`job-card-${job.name}`} onClick={onClick}>
      {job.name} {selected ? '(selected)' : ''}
    </div>
  ),
}));

vi.mock('../components/ResultPanel.jsx', () => ({
  default: ({ onGoDetail }) => (
    <div data-testid="result-panel">
      <button onClick={() => onGoDetail()}>Go Detail</button>
    </div>
  ),
}));

import Dashboard from '../views/Dashboard.jsx';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<Dashboard onGoDetail={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('renders toolbar title and controls', () => {
    const { container } = render(<Dashboard onGoDetail={() => {}} />);
    expect(container.querySelector('.toolbar-title')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Job/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows empty state when no jobs are loaded', () => {
    const { container } = render(<Dashboard onGoDetail={() => {}} />);
    expect(container.querySelector('.empty-state')).toBeTruthy();
    expect(container.querySelector('.empty-title')).toBeTruthy();
    expect(container.querySelector('.empty-desc')).toBeTruthy();
  });
});
