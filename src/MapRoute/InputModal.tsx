import React from "react";
import { Modal, Button } from "react-bootstrap";

interface InputModalProps {
  show: boolean;
  handleClose: () => void;
  title: string;
  children: React.ReactNode;
  handleSubmit: () => void;
}

const InputModal: React.FC<InputModalProps> = ({ show, handleClose, title, children, handleSubmit }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            handleSubmit();
            handleClose();
          }}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InputModal;
