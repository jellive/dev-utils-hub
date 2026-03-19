import type { Meta, StoryObj } from '@storybook/react';
import { URLConverter } from './URLConverter';

const meta: Meta<typeof URLConverter> = {
  title: 'Tools/URLConverter',
  component: URLConverter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof URLConverter>;

export const Default: Story = {};

export const FullEncodingMode: Story = {
  name: 'Full URL Encoding (default)',
  render: () => <URLConverter />,
};

export const QueryParamMode: Story = {
  name: 'Query Param Mode',
  render: () => <URLConverter />,
};
