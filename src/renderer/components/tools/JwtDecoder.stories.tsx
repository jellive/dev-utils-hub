import type { Meta, StoryObj } from '@storybook/react';
import { JwtDecoder } from './JwtDecoder';

const meta: Meta<typeof JwtDecoder> = {
  title: 'Tools/JwtDecoder',
  component: JwtDecoder,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof JwtDecoder>;

export const Default: Story = {};

export const WithSampleToken: Story = {
  name: 'With Sample JWT Token',
  render: () => {
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    return <JwtDecoder />;
  },
};
