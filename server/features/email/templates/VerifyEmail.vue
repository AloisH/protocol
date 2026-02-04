<script setup lang="ts">
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@vue-email/components';

interface Props {
  name: string;
  verificationLink: string;
  email?: string;
}

withDefaults(defineProps<Props>(), {
  email: '',
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

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
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
    <Preview>Verify your email for Bistro</Preview>
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
          Welcome to Bistro, {{ name }}!
        </Heading>

        <Text :style="paragraph">
          Thanks for signing up! Please verify your email address to get started with Bistro.
        </Text>

        <Text :style="paragraph">
          Click the button below to verify your email address:
        </Text>

        <div :style="buttonContainer">
          <Button
            :href="verificationLink"
            :style="button"
          >
            Verify Email Address
          </Button>
        </div>

        <Text :style="paragraph">
          Or copy and paste this URL into your browser:
        </Text>

        <Link
          :href="verificationLink"
          :style="link"
        >
          {{ verificationLink }}
        </Link>

        <Hr :style="hr" />

        <Text :style="footer">
          This verification link will expire in 24 hours. If you didn't create an account with
          Bistro, you can safely ignore this email.
        </Text>

        <Text
          v-if="email"
          :style="footer"
        >
          This email was sent to {{ email }}
        </Text>
      </Container>
    </Body>
  </Html>
</template>
