import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatSearchBar } from './ChatSearchBar';

describe('ChatSearchBar', () => {
  it('renders with default placeholder', () => {
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} />);

    expect(screen.getByPlaceholderText('Pesquisar nas finanças...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} placeholder="Custom search..." />);

    expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  it('calls onSearch when submit button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'search term');

    const submitButton = screen.getByRole('button', { name: /buscar/i });
    await user.click(submitButton);

    expect(onSearch).toHaveBeenCalledWith('search term');
  });

  it('does not call onSearch when input is empty', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} />);

    await user.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('trims whitespace from search query', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '  trimmed query  ');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('trimmed query');
  });

  it('is disabled when disabled prop is true', () => {
    const onSearch = vi.fn();
    render(<ChatSearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
