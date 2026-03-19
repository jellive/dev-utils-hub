import type { Meta, StoryObj } from '@storybook/react';
import { UUIDGenerator } from './UUIDGenerator';

const meta: Meta<typeof UUIDGenerator> = {
  title: 'Tools/UUIDGenerator',
  component: UUIDGenerator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UUIDGenerator>;

export const Default: Story = {};

export const BulkGenerationReady: Story = {
  name: 'Bulk Generation (click Bulk button)',
  render: () => <UUIDGenerator />,
};
