import "./globals.css";
import Link from "next/link";
const links = [
    ["Overview", "/"],
    ["Races", "/races"],
    ["Drivers", "/drivers"],
    ["Compare", "/compare"],
    ["Telemetry", "/telemetry"],
    ["Analytics", "/analytics"],
    ["Live", "/live"],
];
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body>
                <div className="shell">
                    <aside className="side">
                        <div className="brand">APEX</div>
                        <div className="label">Workspace</div>
                        <nav className="nav">
                            {links.map(([n, h]) => (
                                <Link key={h} href={h}>
                                    {n}
                                </Link>
                            ))}
                        </nav>
                        <div className="label">API</div>
                        <nav className="nav">
                            <a href="http://localhost:8000/docs" target="_blank">
                                Swagger
                            </a>
                            <a href="http://localhost:8000/redoc" target="_blank">
                                ReDoc
                            </a>
                        </nav>
                    </aside>
                    <main className="main">
                        <header className="top">
                            <span>F1 RACE INTELLIGENCE / DATA TERMINAL</span>
                            <span>HISTORICAL MODE</span>
                        </header>
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
