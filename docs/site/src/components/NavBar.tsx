import { useState } from "react";
import { Github, Menu, X, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoPng from "@/assets/logo.png";

const navLinks = [
  { label: "Getting Started", href: "#installation" },
  { label: "The Problem", href: "#problem" },
  { label: "Usage", href: "#workflow" },
  { label: "What's Inside", href: "#features" },
  { label: "Under the Hood", href: "#deep-dive" },
  { label: "Pricing", href: "#pricing" },
];

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 sm:gap-3">
          <img src={logoPng} alt="Claude Pilot" className="h-8 sm:h-10 w-auto" />
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => scrollToSection(link.href)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors animated-underline"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="https://pilot.openchangelog.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Changelog"
          >
            <ScrollText className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/maxritter/claude-pilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <Button
            onClick={() => scrollToSection("#installation")}
            className="hidden sm:inline-flex"
            size="sm"
          >
            Get Started
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground p-2"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-t border-border px-4 sm:px-6 py-4 animate-fade-in">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="block w-full text-left py-3 text-muted-foreground hover:text-foreground border-b border-border last:border-0 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <Button
            onClick={() => scrollToSection("#installation")}
            className="mt-4 w-full"
          >
            Get Started
          </Button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
