import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import '../css/Footer.css'; // Make sure to create this CSS file for custom styles

function Footer() {
  return (
    <footer className="footer mt-auto py-3 bg-dark text-white">
      <Container>
        <Row>
          <Col md="4">
            <h5>About Us</h5>
            <p>
              We are a chat application designed to make communication easy and efficient. Stay connected with your friends and colleagues.
            </p>
          </Col>
          <Col md="4">
            <h5>Contact Us</h5>
            <p>
              <FontAwesomeIcon icon={faEnvelope} /> Email: contact@chatapp.com
            </p>
            <p>
              <FontAwesomeIcon icon={faPhone} /> Phone: +123 456 7890
            </p>
          </Col>
          <Col md="4">
            <h5>Follow Us</h5>
            <Nav className="flex-column">
              <Nav.Link href="#" className="text-white">
                <FontAwesomeIcon icon={faFacebook} /> Facebook
              </Nav.Link>
              <Nav.Link href="#" className="text-white">
                <FontAwesomeIcon icon={faTwitter} /> Twitter
              </Nav.Link>
              <Nav.Link href="#" className="text-white">
                <FontAwesomeIcon icon={faInstagram} /> Instagram
              </Nav.Link>
              <Nav.Link href="#" className="text-white">
                <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
              </Nav.Link>
            </Nav>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col md="12" className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} ChatApp. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
