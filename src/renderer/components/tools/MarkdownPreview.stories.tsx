import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownPreview } from './MarkdownPreview';

const meta: Meta<typeof MarkdownPreview> = {
  title: 'Tools/MarkdownPreview',
  component: MarkdownPreview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MarkdownPreview>;

export const Default: Story = {};

export const SplitView: Story = {
  name: 'Split Editor + Preview',
  render: () => <MarkdownPreview />,
};
