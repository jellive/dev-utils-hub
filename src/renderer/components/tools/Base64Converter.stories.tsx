import type { Meta, StoryObj } from '@storybook/react';
import { Base64Converter } from './Base64Converter';

const meta: Meta<typeof Base64Converter> = {
  title: 'Tools/Base64Converter',
  component: Base64Converter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Base64Converter>;

export const Default: Story = {};

export const EncodeTab: Story = {
  name: 'Encode Tab (default)',
  render: () => <Base64Converter />,
};
