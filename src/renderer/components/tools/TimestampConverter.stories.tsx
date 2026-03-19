import type { Meta, StoryObj } from '@storybook/react';
import { TimestampConverter } from './TimestampConverter';

const meta: Meta<typeof TimestampConverter> = {
  title: 'Tools/TimestampConverter',
  component: TimestampConverter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimestampConverter>;

export const Default: Story = {};

export const MillisecondsMode: Story = {
  name: 'Milliseconds Mode (default)',
  render: () => <TimestampConverter />,
};

export const SecondsMode: Story = {
  name: 'Seconds Mode',
  render: () => <TimestampConverter />,
};
