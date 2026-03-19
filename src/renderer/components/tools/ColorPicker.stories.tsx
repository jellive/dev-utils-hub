import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Tools/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {};

export const WithBlueColor: Story = {
  name: 'Blue Color Preset',
  render: () => <ColorPicker />,
};
