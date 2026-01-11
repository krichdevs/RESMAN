import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Header from '../../../src/components/common/Header';
import { AuthContext } from '../../../src/context/AuthContext';

// Mock the AuthContext
const mockLogout = vi.fn();
const mockUser = {
  id: '1',
  email: 'test@centraluniversity.edu.gh',
  firstName: 'John',
  lastName: 'Doe',
  role: 'STUDENT',
  department: 'Computer Science',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAuthContextValue = {
  user: mockUser,
  login: vi.fn(),
  logout: mockLogout,
  isAuthenticated: true,
  isLoading: false,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with user information', () => {
    renderWithProviders(<Header />);

    expect(screen.getByText('CU ACS')).toBeInTheDocument();
    expect(screen.getByText('Available Class System')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('STUDENT')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Header />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    renderWithProviders(<Header />);

    const logoutButton = screen.getByTitle('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows menu button on mobile', () => {
    renderWithProviders(<Header onMenuClick={() => {}} />);

    const menuButton = screen.getByRole('button', { hidden: true });
    expect(menuButton).toBeInTheDocument();
  });
});
