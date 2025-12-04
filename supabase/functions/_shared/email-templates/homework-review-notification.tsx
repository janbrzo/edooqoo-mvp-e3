import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface HomeworkReviewNotificationEmailProps {
  studentName: string;
  teacherName: string;
  homeworkTitle: string;
  homeworkLink: string;
  reviewedAt: string;
}

export const HomeworkReviewNotificationEmail = ({
  studentName,
  teacherName,
  homeworkTitle,
  homeworkLink,
  reviewedAt,
}: HomeworkReviewNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your homework has been reviewed by {teacherName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Homework Reviewed! ✅</Heading>
        
        <Text style={text}>
          Hi <strong>{studentName}</strong>,
        </Text>
        
        <Text style={text}>
          Great news! Your teacher <strong>{teacherName}</strong> has reviewed your homework:
        </Text>
        
        <Section style={homeworkBox}>
          <Heading style={h2}>{homeworkTitle}</Heading>
          <Text style={detailText}>
            📅 Reviewed: <strong>{new Date(reviewedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </Text>
        </Section>
        
        <Link
          href={homeworkLink}
          target="_blank"
          style={button}
        >
          View Your Results
        </Link>
        
        <Text style={text}>
          Click the button above to see your correct answers and teacher's comments.
        </Text>
        
        <Text style={footer}>
          This is an automated message from your English teacher's homework management system.
          If you have any questions, please contact your teacher directly.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default HomeworkReviewNotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const h2 = {
  color: '#1e293b',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const detailText = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const homeworkBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 40px',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 20px',
  margin: '24px 40px',
};

const footer = {
  color: '#898989',
  fontSize: '13px',
  lineHeight: '20px',
  marginTop: '32px',
  padding: '0 40px',
};
