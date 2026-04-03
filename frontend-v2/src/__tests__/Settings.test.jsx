import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockToast = vi.fn();
const mockCfg = {
  baseUrl: 'http://jenkins:8080',
  username: 'admin',
  token: 'token-123',
  cacheRoot: '.cache',
  buildSelector: 'lastSuccessfulBuild',
  verifyTls: true,
};
const mockUpdate = vi.fn();

vi.mock('../App.jsx', () => ({
  useJenkinsCfg: () => ({ cfg: mockCfg, update: mockUpdate }),
  useToast: () => mockToast,
}));

vi.mock('../api.js', () => ({
  post: vi.fn().mockResolvedValue([]),
  api: vi.fn().mockResolvedValue({ mode: 'local' }),
}));

const storage = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, val) => {
      storage[key] = String(val);
    },
    removeItem: (key) => {
      delete storage[key];
    },
  },
  writable: true,
});

globalThis.confirm = vi.fn(() => true);

import Settings from '../views/Settings.jsx';

async function renderSettings() {
  const view = render(<Settings />);
  await screen.findByRole('button', { name: /Local/i });
  return view;
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(storage).forEach((k) => delete storage[k]);
  });

  it('renders five settings sections', async () => {
    const { container } = await renderSettings();
    expect(container.querySelectorAll('.settings-section, .panel').length).toBeGreaterThanOrEqual(5);
  });

  it('shows Jenkins configuration inputs', async () => {
    await renderSettings();
    expect(screen.getByPlaceholderText('http://jenkins.example.com:8080')).toHaveValue('http://jenkins:8080');
    expect(screen.getByPlaceholderText('admin')).toHaveValue('admin');
  });

  it('shows file mode buttons after async config load', async () => {
    await renderSettings();
    expect(screen.getByRole('button', { name: /Local/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cloudium/i })).toBeInTheDocument();
  });

  it('opens the SCM form from the SCM section', async () => {
    const user = userEvent.setup();
    const { container } = await renderSettings();
    const scmSection = container.querySelectorAll('.settings-section')[1];
    const toggleButton = scmSection.querySelector('button');

    expect(toggleButton).toBeTruthy();
    await user.click(toggleButton);
    expect(screen.getByPlaceholderText('my-project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('My Project')).toBeInTheDocument();
  });

  it('shows document path placeholders', async () => {
    await renderSettings();
    expect(screen.getByPlaceholderText('C:/docs/SRS_v1.docx')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('C:/docs/SDS_v1.docx')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('C:/templates/UDS_template.docx')).toBeInTheDocument();
  });
});
