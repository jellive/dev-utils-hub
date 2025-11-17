import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryParamsEditor } from '../QueryParamsEditor';

describe('QueryParamsEditor', () => {
  it('should render empty state when no params', () => {
    render(<QueryParamsEditor params={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/no query parameters/i)).toBeInTheDocument();
  });

  it('should display existing parameters', () => {
    const params = [
      { key: 'page', value: '1' },
      { key: 'limit', value: '10' }
    ];
    render(<QueryParamsEditor params={params} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('page')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('limit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('should show add parameter button', () => {
    render(<QueryParamsEditor params={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /add parameter/i })).toBeInTheDocument();
  });

  it('should call onChange when adding new parameter', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<QueryParamsEditor params={[]} onChange={handleChange} />);

    const addButton = screen.getByRole('button', { name: /add parameter/i });
    await user.click(addButton);

    expect(handleChange).toHaveBeenCalledWith([{ key: '', value: '' }]);
  });

  it('should call onChange when editing parameter key', () => {
    const params = [{ key: 'page', value: '1' }];
    const handleChange = vi.fn();
    render(<QueryParamsEditor params={params} onChange={handleChange} />);

    const keyInput = screen.getByDisplayValue('page');
    fireEvent.change(keyInput, { target: { value: 'pageNum' } });

    expect(handleChange).toHaveBeenCalledWith([{ key: 'pageNum', value: '1' }]);
  });

  it('should call onChange when editing parameter value', () => {
    const params = [{ key: 'page', value: '1' }];
    const handleChange = vi.fn();
    render(<QueryParamsEditor params={params} onChange={handleChange} />);

    const valueInput = screen.getByDisplayValue('1');
    fireEvent.change(valueInput, { target: { value: '2' } });

    expect(handleChange).toHaveBeenCalledWith([{ key: 'page', value: '2' }]);
  });

  it('should show delete button for each parameter', () => {
    const params = [
      { key: 'page', value: '1' },
      { key: 'limit', value: '10' }
    ];
    render(<QueryParamsEditor params={params} onChange={vi.fn()} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('should call onChange when deleting parameter', async () => {
    const user = userEvent.setup();
    const params = [
      { key: 'page', value: '1' },
      { key: 'limit', value: '10' }
    ];
    const handleChange = vi.fn();
    render(<QueryParamsEditor params={params} onChange={handleChange} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(handleChange).toHaveBeenCalledWith([{ key: 'limit', value: '10' }]);
  });

  it('should display parameter count', () => {
    const params = [
      { key: 'page', value: '1' },
      { key: 'limit', value: '10' }
    ];
    render(<QueryParamsEditor params={params} onChange={vi.fn()} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    const params = [{ key: 'page', value: '1' }];
    render(<QueryParamsEditor params={params} onChange={vi.fn()} />);

    expect(screen.getByText(/key/i)).toBeInTheDocument();
    expect(screen.getByText(/value/i)).toBeInTheDocument();
  });
});
