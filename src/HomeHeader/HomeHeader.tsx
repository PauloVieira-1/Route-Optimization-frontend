import { Container, Row, Col, Button } from 'react-bootstrap'

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
                className="fw-bold fs-5 position-absolute rounded-pill px-4 py-2" 
                style={{ bottom: "20px", right: "20px" }}
            >
                Get Started
            </Button>
        </Container>
    )
}

export default HomeHeader
