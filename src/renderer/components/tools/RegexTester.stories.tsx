import type { Meta, StoryObj } from '@storybook/react';
import { RegexTester } from './RegexTester';

const meta: Meta<typeof RegexTester> = {
  title: 'Tools/RegexTester',
  component: RegexTester,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RegexTester>;

export const Default: Story = {};

export const EmailPattern: Story = {
  name: 'Preset: Email Pattern',
  render: () => {
    // RegexTester manages its own state, shown as empty initially
    // Users load presets via the Examples dialog
    return <RegexTester />;
  },
};
