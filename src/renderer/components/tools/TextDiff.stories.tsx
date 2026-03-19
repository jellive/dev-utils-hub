import type { Meta, StoryObj } from '@storybook/react';
import { TextDiff } from './TextDiff';

const meta: Meta<typeof TextDiff> = {
  title: 'Tools/TextDiff',
  component: TextDiff,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextDiff>;

export const Default: Story = {};

export const SplitView: Story = {
  name: 'Split View (default)',
  render: () => <TextDiff />,
};
