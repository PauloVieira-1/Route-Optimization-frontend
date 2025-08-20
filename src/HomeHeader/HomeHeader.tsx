import { Container, Row, Col, Button } from 'react-bootstrap'
import { FaArrowRight } from 'react-icons/fa'
import "./HomeHeader.css"

function HomeHeader() {
    return (
        <Container 
            fluid 
            className="bg-custom-color-grey-lighter2 rounded-bottom-5 px-5 py-5 fw-bold position-relative" 
            style={{ height: '250px', width: '100%' }}
        >
            <Row>
                <Col>
                    <h1 className="text-custom-color-grey-lighter fw-bold fs-1 display-1">
                        Route Optimization Tool
                    </h1>
                    <p className="mt-2 fs-5 fw-light text-custom-color-grey-lighter">
                        Use this tool to optimize your routes
                    </p>
                </Col>
            </Row>
            <Button 
                variant="primary" 
                className="button-circle fw-bold fs-5 position-absolute rounded-pill px-4 py-2 d-flex justify-content-between align-items-center" 
                style={{ bottom: "20px", right: "20px", minWidth: "200px" }}
            >
                <span>Learn More</span>
                <span 
                    className="arrow-circle-wrapper position-relative ms-3"
                    style={{ width: "28px", height: "28px" }}
                >
                    <span 
                        className="arrow-circle d-inline-flex justify-content-center align-items-center rounded-circle text-primary" 
                        style={{ width: "28px", height: "28px", backgroundColor: "#ffffff" }}
                    >
                        <FaArrowRight size={14} />
                    </span>
                </span>
            </Button>
        </Container>
    )
}

export default HomeHeader
