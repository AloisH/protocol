<script setup lang="ts">
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from '@vue-email/components';

interface Props {
  name?: string;
}

withDefaults(defineProps<Props>(), {
  name: '',
});

// Inline styles (required for email clients)
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logo = {
  margin: '0 auto 20px',
  display: 'block',
  width: '120px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const warningText = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#d97706',
  fontWeight: '500',
};

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
};
</script>

<template>
  <Html lang="en">
    <Head />
    <Preview>Your Bistro account has been deleted</Preview>
    <Body :style="main">
      <Container :style="container">
        <Img
          src="/logo.svg"
          alt="Bistro Logo"
          width="120"
          height="30"
          :style="logo"
        />

        <Heading :style="heading">
          Your account has been deleted
        </Heading>

        <Text :style="paragraph">
          <template v-if="name">
            Hi {{ name }},
          </template>
          <template v-else>
            Hi there,
          </template>
        </Text>

        <Text :style="paragraph">
          This email confirms that your Bistro account and all associated data have been permanently
          deleted. This action cannot be undone.
        </Text>

        <Text :style="paragraph">
          All of your projects, settings, and personal information have been removed from our
          systems.
        </Text>

        <Text :style="warningText">
          If you didn't request this deletion, someone may have accessed your account.
        </Text>

        <Hr :style="hr" />

        <Text :style="footer">
          This is an automated confirmation email. Your account has already been deleted.
        </Text>
      </Container>
    </Body>
  </Html>
</template>
