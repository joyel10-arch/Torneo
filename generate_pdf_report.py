import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        if self._pageNumber > 1:
            # Running header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#7E6990"))
            self.drawString(54, 755, "TORNEO: Algorithmic Tournament Management Platform & DSA Engine")
            self.setStrokeColor(colors.HexColor("#D1C4E9"))
            self.setLineWidth(0.6)
            self.line(54, 747, 558, 747)

            # Running footer
            self.line(54, 45, 558, 45)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#7E6990"))
            self.drawString(54, 33, "Project Report & Proposal Guide | Computer Science & Engineering")
            self.drawRightString(558, 33, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()

def build_pdf():
    pdf_filename = r"d:\Torneo\Torneo_Complete_Project_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#2A1238")
    accent_magenta = colors.HexColor("#B8005A")
    accent_teal = colors.HexColor("#007A87")
    body_color = colors.HexColor("#2B2B36")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=1, # Center
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#5D4070"),
        alignment=1,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=accent_magenta,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=accent_teal,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=body_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        leftIndent=15,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1A1A24")
    )

    caption_style = ParagraphStyle(
        'Caption_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#555566"),
        alignment=1,
        spaceBefore=4,
        spaceAfter=10
    )

    story = []

    # ==========================
    # COVER / HEADER BLOCK
    # ==========================
    story.append(Spacer(1, 15))
    story.append(Paragraph("PROJECT REPORT & PROPOSAL SPECIFICATION", ParagraphStyle('TopHeader', fontName='Helvetica-Bold', fontSize=10, textColor=accent_teal, alignment=1, spaceAfter=8)))
    story.append(Paragraph("TORNEO: Algorithmic Tournament Management System", title_style))
    story.append(Paragraph("Bridging Full-Stack Sports Engineering with Core Data Structures & Algorithms (DSA)", subtitle_style))
    
    meta_data = [
        [Paragraph("<b>Project Domain:</b> Web Engineering & Applied DSA", body_style), Paragraph("<b>Target Roles:</b> Admin, Organizer, Viewer", body_style)],
        [Paragraph("<b>Frontend:</b> React 19, TypeScript, Vite, Tailwind/CSS", body_style), Paragraph("<b>Backend:</b> FastAPI (Python 3.13), SQLite, SQLAlchemy", body_style)],
        [Paragraph("<b>Core DSA:</b> Binary Trees, Graphs (DAG), Sorting, Binary Search", body_style), Paragraph("<b>Curriculum Outcomes:</b> CO3, CO4, CO5 (Computer Science)", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 250])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8F5FA")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#D1C4E9")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#EADFF5")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # ==========================
    # 1. EXECUTIVE SUMMARY & NOVELTY
    # ==========================
    story.append(Paragraph("1. Executive Summary & Project Novelty", h1_style))
    story.append(Paragraph(
        "Modern sports tournament websites typically function as thin wrappers around database tables, performing standard <code>SELECT</code> and <code>ORDER BY</code> queries to display brackets and standings. Conversely, academic Data Structures and Algorithms (DSA) courses often teach trees, graphs, and sorting through isolated, terminal-based toy scripts with static dummy arrays.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Torneo solves this duality through a unified architecture:</b> It is a production-ready, full-stack tournament management platform where <b>classical data structures and algorithmic models serve as the foundational execution engine</b>. The system manages single-elimination knockouts, round-robin leagues, dynamic bracket propagation, automated multi-variable standings, and features an interactive <b>DSA Visualization Lab</b> for real-time educational inspection.",
        body_style
    ))

    novelty_points = [
        "<b>1. Explicit Binary Tournament Tree:</b> Implements a genuine binary tree rooted at the Grand Final. Knockout advancement is an <i>O(log N)</i> upward tree traversal with dynamic bye assignment for non-power-of-two team counts.",
        "<b>2. Directed Acyclic Graph (DAG) for Match Dependencies:</b> Models match prerequisites using Adjacency Lists and Matrices. Traverses rounds with BFS and traces championship paths with DFS.",
        "<b>3. Multi-Criteria Instrumented Sorting:</b> Standings are generated via an instrumented Bubble Sort implementing multi-criteria tie-breaking (Points &rarr; Goal Diff &rarr; Goals Scored &rarr; Team Name) with complete execution tracing.",
        "<b>4. Interactive DSA Laboratory:</b> Built-in 'glass-box' visualization engine where students and teachers can step through algorithm passes, inspect Big-O complexities, and observe real-time comparisons and swaps.",
        "<b>5. Multi-Format Scheduling:</b> Full support for both Single Elimination and Round Robin with authentic sporting rules (draws award 1 point without penalty shootouts; knockouts enforce penalty resolution)."
    ]
    for np in novelty_points:
        story.append(Paragraph(f"• {np}", bullet_style))

    story.append(Spacer(1, 8))

    # ==========================
    # 2. SYSTEM ARCHITECTURE & TECH STACK
    # ==========================
    story.append(Paragraph("2. System Architecture & Technical Stack", h1_style))
    story.append(Paragraph(
        "Torneo is engineered using a decoupled, client-server REST architecture providing high throughput, type safety, and real-time state responsiveness.",
        body_style
    ))

    tech_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technologies Used</b>", body_style), Paragraph("<b>Role & Key Responsibilities</b>", body_style)],
        [Paragraph("<b>Frontend UI</b>", body_style), Paragraph("React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, React Flow", body_style), Paragraph("Single Page Application (SPA), state management, interactive bracket visualization, responsive dashboards, DSA Lab step visualizer.", body_style)],
        [Paragraph("<b>Backend API</b>", body_style), Paragraph("FastAPI (Python 3.13), Uvicorn, Pydantic v2", body_style), Paragraph("High-performance asynchronous REST endpoints, request validation, serialization, business logic routing, audit logging.", body_style)],
        [Paragraph("<b>DSA Engine</b>", body_style), Paragraph("Pure Python (Zero 3rd-party library shortcuts)", body_style), Paragraph("Custom implementations of Binary Tournament Tree, Graph Traversal (BFS/DFS), Multi-Criteria Bubble Sort, Binary Search.", body_style)],
        [Paragraph("<b>Database</b>", body_style), Paragraph("SQLite / PostgreSQL, SQLAlchemy 2.0 ORM", body_style), Paragraph("Relational data modeling, foreign key constraints, cascading deletions, ACID transaction guarantees for match state updates.", body_style)],
        [Paragraph("<b>Security</b>", body_style), Paragraph("OAuth2, JWT (JSON Web Tokens), bcrypt", body_style), Paragraph("Role-Based Access Control (Admin, Organizer, Viewer), password hashing, stateless token authentication.", body_style)]
    ]
    tech_table = Table(tech_data, colWidths=[80, 180, 240])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#ECE4F4")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1C4E9")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tech_table)

    story.append(PageBreak())

    # ==========================
    # 3. CORE DSA ALGORITHMS DEEP-DIVE
    # ==========================
    story.append(Paragraph("3. Core Data Structures & Algorithms (DSA) Implementation", h1_style))
    story.append(Paragraph(
        "A central requirement of the academic curriculum is understanding and applying core data structures (Trees, Graphs, Sorting, Searching). Below is the comprehensive technical breakdown of how each algorithm is mapped and coded in Torneo.",
        body_style
    ))

    # Alg 1: Tournament Tree
    story.append(Paragraph("3.1 Binary Tournament Tree (Knockout Elimination)", h2_style))
    story.append(Paragraph("<b>Source File:</b> <code>backend/app/algorithms/tournament_tree.py</code> | <b>Curriculum Outcome:</b> CO4 (Tree Structures)", h3_style))
    story.append(Paragraph(
        "Knockout tournaments naturally follow a hierarchical binary tree structure rooted at the championship match (Round <i>K</i>). Each match in round <i>r</i> is fed by exactly two matches from round <i>r-1</i>.",
        body_style
    ))
    
    tree_specs = [
        "<b>Node Definition (<code>MatchNode</code>):</b> Contains <code>match_id</code>, <code>round_number</code>, <code>scores</code>, <code>winner_name</code>, pointers <code>left</code> (home feeder), <code>right</code> (away feeder), and <code>parent</code> (next round match).",
        "<b>Winner Advancement Algorithm:</b> When a match score is submitted, the tree updates the winner and traverses up the <code>parent</code> pointer to insert the winner into the home or away slot of the subsequent match. This takes <b>O(log N)</b> time.",
        "<b>Bye Assignment Logic:</b> For <i>N</i> teams where <i>N</i> is not a power of 2, the algorithm determines the nearest power of 2 (<i>2^k &ge; N</i>) and awards <i>2^k - N</i> byes to top seeds, ensuring balanced subtrees."
    ]
    for ts in tree_specs:
        story.append(Paragraph(f"• {ts}", bullet_style))

    # Alg 2: Graph Algorithm
    story.append(Paragraph("3.2 Tournament Graph & Dependency Traversal", h2_style))
    story.append(Paragraph("<b>Source File:</b> <code>backend/app/algorithms/graph_algorithms.py</code> | <b>Curriculum Outcome:</b> CO5 (Graph Structures)", h3_style))
    story.append(Paragraph(
        "A multi-stage tournament represents a <b>Directed Acyclic Graph (DAG)</b>. Vertices <i>V</i> represent individual match fixtures, and directed edges <i>E = (u, v)</i> indicate that the outcome of match <i>u</i> is required before match <i>v</i> can commence.",
        body_style
    ))
    graph_specs = [
        "<b>Dual Representation:</b> The graph maintains both an <b>Adjacency List</b> (memory-efficient <i>O(V + E)</i> representation for sparse brackets) and an <b>Adjacency Matrix</b> (constant-time <i>O(1)</i> feeder relationship lookup).",
        "<b>Breadth-First Search (BFS):</b> Traverses the tournament round-by-round using a FIFO queue. Used to evaluate match readiness, determine which matches can be scheduled simultaneously across venues, and calculate topological stages.",
        "<b>Depth-First Search (DFS):</b> Traces the lineage of a team backward from the Final node to their qualifying preliminary match, reconstructing their 'path to glory' with <i>O(V + E)</i> time complexity."
    ]
    for gs in graph_specs:
        story.append(Paragraph(f"• {gs}", bullet_style))

    # Alg 3: Bubble Sort
    story.append(Paragraph("3.3 Multi-Criteria Bubble Sort with Trace Instrumentor", h2_style))
    story.append(Paragraph("<b>Source File:</b> <code>backend/app/algorithms/bubble_sort.py</code> | <b>Curriculum Outcome:</b> CO3 (Sorting & Order)", h3_style))
    story.append(Paragraph(
        "To satisfy the academic requirement of manual sorting without reliance on Python's native <code>sort()</code>, Torneo features a custom multi-pass Bubble Sort equipped with sports tie-breaking logic and an execution tracer.",
        body_style
    ))
    sort_specs = [
        "<b>Comparison Hierarchy:</b> 1) Points (descending) &rarr; 2) Goal Difference (descending) &rarr; 3) Goals Scored (descending) &rarr; 4) Lexicographical Team Name (tie-breaker).",
        "<b>State Machine Tracing:</b> The algorithm captures an array of snapshot frames: <code>{pass, step, compared_indices, swapped, snapshot}</code>. This allows the frontend DSA Lab to animate every swap in real time.",
        "<b>Complexity Profile:</b> Worst-case comparisons: <i>N(N-1)/2 &isin; O(N^2)</i>. Optimized with an early-exit flag when zero swaps occur in a pass (best-case <i>O(N)</i>)."
    ]
    for ss in sort_specs:
        story.append(Paragraph(f"• {ss}", bullet_style))

    # Alg 4: Binary Search
    story.append(Paragraph("3.4 Binary Search for Fast Record Lookup", h2_style))
    story.append(Paragraph("<b>Source File:</b> <code>backend/app/algorithms/binary_search.py</code> | <b>Curriculum Outcome:</b> CO3 (Search Algorithms)", h3_style))
    story.append(Paragraph(
        "Performs logarithmic <i>O(log N)</i> retrieval on pre-sorted team tables and schedules. Records low, mid, and high pointers at every iteration for educational step-through in the DSA visualizer.",
        body_style
    ))

    # Alg 5: Round Robin Berger
    story.append(Paragraph("3.5 Berger Cyclic Round-Robin Scheduling Algorithm", h2_style))
    story.append(Paragraph("<b>Source File:</b> <code>backend/app/services/bracket_service.py</code>", h3_style))
    story.append(Paragraph(
        "Implements the polygon/circle method for league tournament generation: for <i>N</i> teams, <i>N-1</i> rounds are generated (where <i>N</i> is even), rotating <i>N-1</i> elements while keeping one fixed. Guarantees that every team plays every other team once with optimal home/away equity.",
        body_style
    ))

    story.append(PageBreak())

    # ==========================
    # 4. BACKEND ARCHITECTURE & DATABASE
    # ==========================
    story.append(Paragraph("4. Backend Workflow & Database Architecture", h1_style))
    story.append(Paragraph(
        "The backend is structured into modular layers adhering to clean architecture principles: <b>API Endpoints</b>, <b>Domain Models</b>, <b>Pydantic Schemas</b>, and <b>Algorithmic Services</b>.",
        body_style
    ))

    # Database Entity Table
    story.append(Paragraph("4.1 Relational Data Models", h2_style))
    db_data = [
        [Paragraph("<b>Model Name</b>", body_style), Paragraph("<b>Key Attributes</b>", body_style), Paragraph("<b>Relationships & Constraints</b>", body_style)],
        [Paragraph("<b>User</b>", body_style), Paragraph("<code>id, email, password_hash, role, full_name</code>", body_style), Paragraph("Roles: admin, organizer, viewer. Has many tournaments.", body_style)],
        [Paragraph("<b>Tournament</b>", body_style), Paragraph("<code>id, name, sport_type, format, status, max_teams</code>", body_style), Paragraph("Format: single_elimination, round_robin. Status: registration_open, in_progress, completed.", body_style)],
        [Paragraph("<b>Team</b>", body_style), Paragraph("<code>id, name, short_name, logo_url, captain_name</code>", body_style), Paragraph("Associated via TournamentTeam join-table with tournament-specific stats.", body_style)],
        [Paragraph("<b>Match</b>", body_style), Paragraph("<code>id, tournament_id, round_number, home_score, away_score, winner_id, parent_match_id</code>", body_style), Paragraph("Self-referencing tree pointers (parent_match_id, feeder_matches) and venue assignment.", body_style)],
        [Paragraph("<b>Venue</b>", body_style), Paragraph("<code>id, name, address, capacity, surface_type</code>", body_style), Paragraph("Hosts match fixtures; prevents double-booking conflicts.", body_style)],
        [Paragraph("<b>AuditLog</b>", body_style), Paragraph("<code>id, user_id, action, entity_type, timestamp</code>", body_style), Paragraph("Tracks all administrative actions and score modifications for regulatory auditing.", body_style)]
    ]
    db_table = Table(db_data, colWidths=[90, 190, 220])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#ECE4F4")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1C4E9")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(db_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.2 Tournament Execution State Machine", h2_style))
    story.append(Paragraph(
        "<b>1. Setup & Registration:</b> Tournament created with sport rules and venue availability. Teams register until <code>max_teams</code> reached.<br/>"
        "<b>2. Schedule Generation:</b> Organizer triggers schedule creation. For Single Elimination, the Binary Tournament Tree generates bracket fixtures with byes. For Round Robin, the Berger cyclic algorithm generates matchday schedules.<br/>"
        "<b>3. Match Resolution:</b> When scores are entered, the system validates rules (in knockouts, draws require penalties; in round-robin, draws are preserved awarding 1 point to each team). Winners propagate automatically.<br/>"
        "<b>4. Standings Recalculation:</b> Automated service recalculates points, goal differences, and form tables dynamically after each confirmed score.",
        body_style
    ))

    story.append(PageBreak())

    # ==========================
    # 5. USER INTERFACE & SCREENSHOT SHOWCASE
    # ==========================
    story.append(Paragraph("5. User Interface Showcase & Screen Descriptions", h1_style))
    story.append(Paragraph(
        "The following screenshots illustrate the actual running Torneo web application, demonstrating both the core tournament operations and the specialized DSA visualization suite.",
        body_style
    ))

    img_dir = r"d:\Torneo\screenshots"
    img_width = 480
    img_height = 270

    def add_screen_block(img_name, title, desc):
        full_path = os.path.join(img_dir, img_name)
        if os.path.exists(full_path):
            img_flowable = Image(full_path, width=img_width, height=img_height)
            block = [
                Paragraph(f"<b>{title}</b>", h2_style),
                Paragraph(desc, body_style),
                Spacer(1, 2),
                img_flowable,
                Paragraph(f"Figure: Actual screenshot of {title} in Torneo", caption_style),
                Spacer(1, 6)
            ]
            return KeepTogether(block)
        return Paragraph(f"<i>[Screenshot {img_name} not found]</i>", body_style)

    # Screen 1: Dashboard
    story.append(add_screen_block(
        "dashboard.png",
        "5.1 Analytics & Tournament Operations Dashboard",
        "Displays real-time tournament metrics, active matches, quick actions, team distribution, and recent score updates."
    ))

    # Screen 2: Tournament Detail
    story.append(add_screen_block(
        "tournament_detail.png",
        "5.2 Tournament Control Center (Kerala Premier League)",
        "Shows tournament status, format specification, matchday fixture generation, and tab navigation (Fixtures, Bracket/Schedule, Standings, Teams, Venues)."
    ))

    story.append(PageBreak())

    # Screen 3: Standings
    story.append(add_screen_block(
        "standings.png",
        "5.3 Real-Time Standings & League Table",
        "Live standings calculated dynamically based on match results, displaying Played (P), Won (W), Drawn (D), Lost (L), Goals For (GF), Goals Against (GA), Goal Difference (GD), and Points (PTS)."
    ))

    # Screen 4: DSA Lab - Bubble Sort
    story.append(add_screen_block(
        "dsa_lab.png",
        "5.4 Interactive DSA Lab: Multi-Criteria Bubble Sort Visualizer",
        "Step-by-step visual execution of Bubble Sort on real team standings. Shows comparison counters, swap metrics, O(N^2) complexity indicator, and prev/next playback controls."
    ))

    story.append(PageBreak())

    # Screen 5: DSA Lab - Tournament Tree
    story.append(add_screen_block(
        "dsa_tree.png",
        "5.5 Interactive DSA Lab: Binary Tournament Tree",
        "Visualizes the explicit binary tree structure of knockout tournaments, showing root (Final), feeder leaf nodes, match progression, and tree depth."
    ))

    # Screen 6: DSA Lab - Match Graph
    story.append(add_screen_block(
        "dsa_graph.png",
        "5.6 Interactive DSA Lab: Directed Match Progression Graph (DAG)",
        "Visualizes match fixtures as graph vertices and feeder progressions as directed edges. Demonstrates BFS level-order traversal and DFS championship path tracing."
    ))

    story.append(PageBreak())

    # ==========================
    # 6. PPT SLIDE DECK TEMPLATE
    # ==========================
    story.append(Paragraph("6. Ready-to-Use PPT Slide Deck Structure", h1_style))
    story.append(Paragraph(
        "Use this exact slide-by-slide outline for your project presentation to your teacher/evaluator:",
        body_style
    ))

    slides = [
        ("Slide 1: Title & Introduction", "Title: 'Torneo - Algorithmic Tournament Management Platform'\nSubtitle: Applying Core Data Structures & Algorithms to Modern Web Engineering\nPresenter Name, Department of Computer Science & Engineering."),
        ("Slide 2: Problem Statement & Motivation", "• Traditional tournament platforms lack algorithmic transparency.\n• Academic DSA courses teach algorithms in abstract consoles with dummy numbers.\n• Need for a production-grade system where real algorithms drive business logic."),
        ("Slide 3: Proposed Solution & Key Objectives", "• Full-stack management for Knockouts (Single Elimination) & Leagues (Round Robin).\n• Implementation of foundational DSA from scratch without built-in library cheats.\n• Interactive DSA Laboratory for pedagogical inspection and algorithmic verification."),
        ("Slide 4: Technical Architecture & Stack", "• Client: React 19, TypeScript, Vite, TailwindCSS (SPA architecture).\n• Server: FastAPI, Python 3.13, Uvicorn, SQLAlchemy ORM.\n• Database: SQLite / PostgreSQL with foreign key integrity and audit logs."),
        ("Slide 5: Algorithm 1 - Binary Tournament Tree (CO4)", "• Single elimination modeled as a binary tree rooted at the Final.\n• Node structure: MatchNode with left/right feeders and parent pointer.\n• O(log N) winner propagation and dynamic bye calculation for non-power-of-2 teams."),
        ("Slide 6: Algorithm 2 - Tournament DAG & Graph Traversal (CO5)", "• Tournament match dependencies modeled as Directed Acyclic Graph.\n• Adjacency List & Matrix representations.\n• BFS for concurrent round scheduling; DFS for championship path lineage."),
        ("Slide 7: Algorithm 3 - Multi-Criteria Bubble Sort (CO3)", "• Standings sorting using Points &rarr; Goal Diff &rarr; Goals Scored &rarr; Team Name.\n• Instrumented execution tracing for step-by-step playback in the UI.\n• Worst-case O(N^2) vs Best-case O(N) early termination."),
        ("Slide 8: Algorithm 4 - Round Robin Scheduling & Draw Handling", "• Berger cyclic polygon algorithm for fair all-play-all schedule generation.\n• Clear distinction between knockout tie-breakers (penalties) vs league ties (1 pt each)."),
        ("Slide 9: Live Demo & DSA Lab Showcase", "• Walkthrough of Tournament Creation & Schedule Generation.\n• Live demonstration of the DSA Lab: stepping through Bubble Sort, Tree, and Graph tabs."),
        ("Slide 10: Conclusion, Outcomes & Future Enhancements", "• Achieved: Unified production app with academic DSA rigor.\n• Course Outcomes validated: CO3 (Sorting/Searching), CO4 (Trees), CO5 (Graphs).\n• Future work: Double elimination brackets, Swiss-system format, live push notifications.")
    ]

    for s_title, s_content in slides:
        story.append(Paragraph(f"<b>{s_title}</b>", h3_style))
        story.append(Paragraph(s_content.replace('\n', '<br/>'), bullet_style))
        story.append(Spacer(1, 3))

    story.append(PageBreak())

    # ==========================
    # 7. VIVA & EVALUATION Q&A
    # ==========================
    story.append(Paragraph("7. Examiner / Viva Defense Q&A Guide", h1_style))
    story.append(Paragraph(
        "Prepare for your presentation and viva evaluation with these answers to expected faculty questions:",
        body_style
    ))

    qas = [
        (
            "Q1: Why did you implement Bubble Sort instead of using Python's built-in <code>sorted()</code> or QuickSort?",
            "<b>Answer:</b> While built-in <code>sorted()</code> is faster (Timsort, <i>O(N log N)</i>), it acts as a black box that cannot be inspected step-by-step. We implemented our own multi-criteria sorting algorithm with execution instrumentation so that every pass, comparison, and swap is recorded and can be played back visually in the DSA Lab for academic verification."
        ),
        (
            "Q2: How does the Binary Tournament Tree handle a tournament with 5 or 6 teams?",
            "<b>Answer:</b> A balanced binary tree requires a power of 2 number of leaf slots (e.g., 4, 8, 16). When <i>N=6</i> teams participate, the algorithm calculates the next power of 2 (<i>8</i>), awards <i>8 - 6 = 2</i> byes to the highest seeds, and places the remaining 4 teams in preliminary matches, seamlessly preserving the binary tree invariant."
        ),
        (
            "Q3: What is the time complexity of propagating a winner through the tournament bracket?",
            "<b>Answer:</b> Because the tournament bracket is structured as a balanced binary tree of depth <i>D = log_2(N)</i>, winner advancement simply follows the <code>parent</code> pointer from the completed match to the root. Thus, updating the bracket takes exactly <b>O(log N)</b> operations."
        ),
        (
            "Q4: How are draw matches handled differently between Single Elimination and Round Robin?",
            "<b>Answer:</b> In single elimination knockouts, a match cannot end in a draw because a winner is required to advance up the binary tree; therefore, the system mandates a penalty shootout. In round robin league format, draws are a valid terminal state; both teams are awarded 1 point and <code>winner_id</code> is set to <code>None</code>."
        ),
        (
            "Q5: How is graph traversal applied in this project?",
            "<b>Answer:</b> Matches are modeled as vertices in a Directed Acyclic Graph (DAG) with edges representing feeder progression. Breadth-First Search (BFS) is used to traverse matches level-by-level to ensure preceding matches are complete before scheduling dependent matches. Depth-First Search (DFS) backtracks from the final to trace any team's route through the tournament."
        )
    ]

    for q, a in qas:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(a, body_style))
        story.append(Spacer(1, 4))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF report at: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
