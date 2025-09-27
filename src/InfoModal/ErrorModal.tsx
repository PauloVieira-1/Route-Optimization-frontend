import React from "react";
import { Modal, Button } from "react-bootstrap";

interface ErrorModalProps {
  show: boolean;
  onHide: () => void;
  errors?: string[];
}

const ErrorModal: React.FC<ErrorModalProps> = ({ show, onHide, errors = [] }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>Validation Errors</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errors.length > 0 ? (
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index} className="text-danger">
                {error}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mb-0">No errors found.</p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
                    className="rounded-pill px-5 py-4 button-circle bg-danger text-white"
                    onClick={onHide}
                  >
                    Close
                  </Button>
      </Modal.Footer>
      
    </Modal>
  );
};

export default ErrorModal;
