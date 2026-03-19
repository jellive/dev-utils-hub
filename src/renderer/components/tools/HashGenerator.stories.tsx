import type { Meta, StoryObj } from '@storybook/react';
import { HashGenerator } from './HashGenerator';

const meta: Meta<typeof HashGenerator> = {
  title: 'Tools/HashGenerator',
  component: HashGenerator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HashGenerator>;

export const Default: Story = {};

export const MD5Mode: Story = {
  name: 'MD5 Algorithm (default)',
  render: () => <HashGenerator />,
};

export const HMACMode: Story = {
  name: 'HMAC Mode',
  render: () => <HashGenerator />,
};
