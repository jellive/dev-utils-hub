import type { Meta, StoryObj } from '@storybook/react';
import { JsonFormatter } from './JsonFormatter';

const meta: Meta<typeof JsonFormatter> = {
  title: 'Tools/JsonFormatter',
  component: JsonFormatter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof JsonFormatter>;

export const Default: Story = {
  args: {},
};

export const WithInitialInput: Story = {
  args: {
    initialInput: '{"name":"Alice","age":30,"city":"Seoul","hobbies":["coding","reading"]}',
  },
};

export const WithSendToBase64: Story = {
  args: {
    initialInput: '{"token":"abc123","userId":42}',
    onSendToBase64: (value: string) => {
      console.log('Send to Base64:', value);
    },
  },
};
