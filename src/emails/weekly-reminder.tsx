import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WeeklyReminderEmailProps {
  displayName: string;
  themeTitle: string;
  scriptureReference: string;
  scriptureSnippet: string;
  weekUrl: string;
  unsubscribeUrl: string;
}

export function WeeklyReminderEmail({
  displayName,
  themeTitle,
  scriptureReference,
  scriptureSnippet,
  weekUrl,
  unsubscribeUrl,
}: WeeklyReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Get your S.T.E.P.S. in this week - {themeTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>S.T.E.P.S.</Text>
          <Heading style={heading}>Get your S.T.E.P.S. in this week</Heading>
          <Text style={text}>Hi {displayName},</Text>
          <Text style={text}>
            This week&apos;s theme is <strong>{themeTitle}</strong>. Take a few
            quiet minutes to read, reflect, pray, and share with the group.
          </Text>
          <Section style={scriptureBox}>
            <Text style={ref}>{scriptureReference}</Text>
            <Text style={scripture}>{scriptureSnippet}</Text>
          </Section>
          <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
            <Button href={weekUrl} style={button}>
              Get your S.T.E.P.S. in
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re receiving this because you opted into weekly reminders.{" "}
            <a href={unsubscribeUrl} style={link}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f3f6f2",
  fontFamily:
    'Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "520px",
  backgroundColor: "#fbfcf9",
  borderRadius: "16px",
  border: "1px solid #d5ddd6",
};

const brand = {
  color: "#1f5c45",
  fontSize: "28px",
  fontWeight: "700" as const,
  margin: "0 0 8px",
  fontFamily: "Georgia, serif",
};

const heading = {
  color: "#1a2e24",
  fontSize: "22px",
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const text = {
  color: "#1a2e24",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const scriptureBox = {
  backgroundColor: "#dce9e1",
  borderRadius: "12px",
  padding: "16px 18px",
  margin: "16px 0",
};

const ref = {
  color: "#b7791f",
  fontSize: "12px",
  fontWeight: "700" as const,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const scripture = {
  color: "#1a2e24",
  fontSize: "16px",
  fontStyle: "italic" as const,
  lineHeight: "1.55",
  margin: "0",
  fontFamily: "Georgia, serif",
};

const button = {
  backgroundColor: "#1f5c45",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700" as const,
  textDecoration: "none",
  padding: "14px 22px",
  display: "inline-block",
};

const hr = {
  borderColor: "#d5ddd6",
  margin: "24px 0",
};

const footer = {
  color: "#4a5d52",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const link = {
  color: "#1f5c45",
};
