import type { Meta, StoryObj } from '@storybook/react';
import { CronParser } from './CronParser';

const meta: Meta<typeof CronParser> = {
  title: 'Tools/CronParser',
  component: CronParser,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CronParser>;

export const Default: Story = {};

export const EveryMinutePreset: Story = {
  name: 'Every Minute Preset',
  render: () => <CronParser />,
};

export const WeeklyPreset: Story = {
  name: 'Weekly Preset',
  render: () => <CronParser />,
};
