import { Container } from "react-bootstrap";
import HomeHeader from "../HomeHeader/HomeHeader"

function Home() {
    return (
        <Container fluid className="p-3">
            <HomeHeader />
        </Container>
    )
}

export default Home