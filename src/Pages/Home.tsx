import { Container } from "react-bootstrap";
import HomeHeader from "../HomeHeader/HomeHeader"
import ScenarioMenu from "../ScenarioMenu/ScenarioMenu";

function Home() {
    return (
        <Container fluid className="p-3">
            <HomeHeader />
            <ScenarioMenu />
        </Container>
    )
}

export default Home