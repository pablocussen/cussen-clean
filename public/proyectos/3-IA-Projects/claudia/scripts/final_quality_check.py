#!/usr/bin/env python3
"""
CLAUDIA v10.0 - Final Quality Check

Comprehensive final validation before production launch.
Runs all tests, audits, and quality checks.

Usage:
    python scripts/final_quality_check.py
"""

import json
import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class FinalQualityCheck:
    """Final quality checker for CLAUDIA v10.0."""

    def __init__(self, project_root: Path):
        """Initialize quality checker.

        Args:
            project_root: Project root directory
        """
        self.project_root = project_root
        self.checks = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def run_check(self, name: str, command: List[str], critical: bool = True) -> bool:
        """Run a quality check command.

        Args:
            name: Name of the check
            command: Command to execute
            critical: Whether failure should block deployment

        Returns:
            True if check passed
        """
        logger.info(f"Running: {name}...")

        try:
            result = subprocess.run(
                command,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes max
            )

            passed = result.returncode == 0

            self.checks.append({
                "name": name,
                "critical": critical,
                "passed": passed,
                "output": result.stdout + result.stderr
            })

            if passed:
                logger.info(f"✓ {name} - PASSED")
                self.passed += 1
            else:
                if critical:
                    logger.error(f"✗ {name} - FAILED (CRITICAL)")
                    self.failed += 1
                else:
                    logger.warning(f"⚠ {name} - FAILED (WARNING)")
                    self.warnings += 1

            return passed

        except subprocess.TimeoutExpired:
            logger.error(f"✗ {name} - TIMEOUT")
            self.checks.append({
                "name": name,
                "critical": critical,
                "passed": False,
                "output": "Timeout exceeded"
            })
            if critical:
                self.failed += 1
            else:
                self.warnings += 1
            return False

        except Exception as e:
            logger.error(f"✗ {name} - ERROR: {e}")
            self.checks.append({
                "name": name,
                "critical": critical,
                "passed": False,
                "output": str(e)
            })
            if critical:
                self.failed += 1
            else:
                self.warnings += 1
            return False

    def run_all_checks(self) -> bool:
        """Run all quality checks.

        Returns:
            True if all critical checks passed
        """
        logger.info("=" * 70)
        logger.info("CLAUDIA v10.0 - FINAL QUALITY CHECK")
        logger.info("=" * 70)
        logger.info("")

        # 1. Code Quality Checks
        logger.info("📋 PHASE 1: Code Quality")
        logger.info("-" * 70)

        self.run_check(
            "Black formatting",
            ["black", ".", "--check"],
            critical=False
        )

        self.run_check(
            "Pylint analysis",
            ["pylint", "claudia_modules/", "--exit-zero"],
            critical=False
        )

        # 2. Testing
        logger.info("")
        logger.info("🧪 PHASE 2: Testing")
        logger.info("-" * 70)

        self.run_check(
            "Unit tests",
            ["pytest", "-v", "--tb=short"],
            critical=True
        )

        self.run_check(
            "Test coverage",
            ["pytest", "--cov=claudia_modules", "--cov-report=term-missing"],
            critical=False
        )

        # 3. Security
        logger.info("")
        logger.info("🔒 PHASE 3: Security")
        logger.info("-" * 70)

        self.run_check(
            "Security audit",
            ["python", "scripts/security_audit.py"],
            critical=True
        )

        # 4. File Validation
        logger.info("")
        logger.info("📁 PHASE 4: File Validation")
        logger.info("-" * 70)

        self.check_required_files()

        # 5. Configuration
        logger.info("")
        logger.info("⚙️ PHASE 5: Configuration")
        logger.info("-" * 70)

        self.check_configuration()

        # 6. Documentation
        logger.info("")
        logger.info("📚 PHASE 6: Documentation")
        logger.info("-" * 70)

        self.check_documentation()

        return self.failed == 0

    def check_required_files(self):
        """Check that all required files exist."""
        required_files = [
            "main.py",
            "requirements.txt",
            ".env.example",
            "firebase.json",
            "firestore.rules",
            "firestore.indexes.json",
            "README.md",
            "PRODUCTION_CHECKLIST.md",
            "Dockerfile",
            "web_app/index.html",
            "web_app/apu_database.json",
            "claudia_modules/ai_core.py",
            "claudia_modules/telegram_api.py",
            "claudia_modules/rate_limiter.py",
            "claudia_modules/security.py",
            "claudia_modules/health.py",
            "scripts/deploy_production.sh",
            "scripts/rollback.sh",
            "docs/DEPLOYMENT.md",
            "docs/ARCHITECTURE.md",
            "docs/API.md"
        ]

        missing = []
        for file_path in required_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                missing.append(file_path)

        if missing:
            logger.error(f"✗ Missing required files: {len(missing)}")
            for file_path in missing:
                logger.error(f"  - {file_path}")
            self.failed += 1
            self.checks.append({
                "name": "Required files check",
                "critical": True,
                "passed": False,
                "output": f"Missing: {', '.join(missing)}"
            })
        else:
            logger.info("✓ All required files present")
            self.passed += 1
            self.checks.append({
                "name": "Required files check",
                "critical": True,
                "passed": True,
                "output": "All required files found"
            })

    def check_configuration(self):
        """Check configuration files."""
        config_checks = []

        # Check .env.example
        env_example = self.project_root / ".env.example"
        if env_example.exists():
            content = env_example.read_text()
            required_vars = [
                "TELEGRAM_TOKEN",
                "GEMINI_API_KEY",
                "GOOGLE_CLOUD_PROJECT",
                "RATE_LIMIT_MAX_REQUESTS",
                "ENABLE_RATE_LIMITING"
            ]

            missing_vars = [var for var in required_vars if var not in content]

            if missing_vars:
                logger.warning(f"⚠ Missing variables in .env.example: {missing_vars}")
                config_checks.append(False)
                self.warnings += 1
            else:
                logger.info("✓ .env.example has all required variables")
                config_checks.append(True)
                self.passed += 1
        else:
            logger.error("✗ .env.example not found")
            config_checks.append(False)
            self.failed += 1

        # Check firebase.json
        firebase_config = self.project_root / "firebase.json"
        if firebase_config.exists():
            try:
                with open(firebase_config) as f:
                    config = json.load(f)

                if "hosting" in config and "firestore" in config:
                    logger.info("✓ firebase.json properly configured")
                    config_checks.append(True)
                    self.passed += 1
                else:
                    logger.warning("⚠ firebase.json missing sections")
                    config_checks.append(False)
                    self.warnings += 1
            except Exception as e:
                logger.error(f"✗ Invalid firebase.json: {e}")
                config_checks.append(False)
                self.failed += 1
        else:
            logger.error("✗ firebase.json not found")
            config_checks.append(False)
            self.failed += 1

        self.checks.append({
            "name": "Configuration check",
            "critical": True,
            "passed": all(config_checks),
            "output": f"{sum(config_checks)}/{len(config_checks)} config checks passed"
        })

    def check_documentation(self):
        """Check documentation quality."""
        doc_checks = []

        # Check README.md
        readme = self.project_root / "README.md"
        if readme.exists():
            content = readme.read_text()
            required_sections = [
                "# ",  # Title
                "## ",  # Sections
                "Installation",
                "Usage",
                "Features"
            ]

            missing_sections = [
                section for section in required_sections
                if section.lower() not in content.lower()
            ]

            if missing_sections:
                logger.warning(f"⚠ README.md missing sections: {missing_sections}")
                doc_checks.append(False)
                self.warnings += 1
            else:
                logger.info("✓ README.md is complete")
                doc_checks.append(True)
                self.passed += 1
        else:
            logger.error("✗ README.md not found")
            doc_checks.append(False)
            self.failed += 1

        # Check DEPLOYMENT.md
        deployment_doc = self.project_root / "docs" / "DEPLOYMENT.md"
        if deployment_doc.exists() and deployment_doc.stat().st_size > 1000:
            logger.info("✓ DEPLOYMENT.md exists and is comprehensive")
            doc_checks.append(True)
            self.passed += 1
        else:
            logger.warning("⚠ DEPLOYMENT.md missing or incomplete")
            doc_checks.append(False)
            self.warnings += 1

        self.checks.append({
            "name": "Documentation check",
            "critical": False,
            "passed": all(doc_checks),
            "output": f"{sum(doc_checks)}/{len(doc_checks)} doc checks passed"
        })

    def generate_report(self) -> Dict[str, Any]:
        """Generate final quality report.

        Returns:
            Report dictionary
        """
        total = self.passed + self.failed + self.warnings
        score = (self.passed / total * 100) if total > 0 else 0

        return {
            "version": "10.0",
            "timestamp": str(subprocess.check_output(
                ["git", "rev-parse", "HEAD"],
                cwd=self.project_root
            ).decode().strip()[:8]),
            "summary": {
                "total_checks": total,
                "passed": self.passed,
                "failed": self.failed,
                "warnings": self.warnings,
                "score": round(score, 1),
                "production_ready": self.failed == 0
            },
            "checks": self.checks
        }

    def print_report(self, report: Dict[str, Any]):
        """Print quality report.

        Args:
            report: Report dictionary
        """
        print("\n" + "=" * 70)
        print("FINAL QUALITY REPORT")
        print("=" * 70)

        summary = report["summary"]
        print(f"\n📊 SUMMARY:")
        print(f"   Version: {report['version']}")
        print(f"   Commit: {report['timestamp']}")
        print(f"   Total Checks: {summary['total_checks']}")
        print(f"   ✓ Passed: {summary['passed']}")
        print(f"   ✗ Failed: {summary['failed']}")
        print(f"   ⚠ Warnings: {summary['warnings']}")
        print(f"   Score: {summary['score']}/100")

        print(f"\n{'=' * 70}")

        if summary['production_ready']:
            print("🚀 STATUS: PRODUCTION READY")
            print("   All critical checks passed. Safe to deploy.")
            return 0
        else:
            print("❌ STATUS: NOT READY FOR PRODUCTION")
            print("   Critical checks failed. Fix issues before deploying.")
            print(f"\n📋 FAILED CHECKS:")
            for check in report["checks"]:
                if not check["passed"] and check["critical"]:
                    print(f"   - {check['name']}")
            return 1

    def save_report(self, report: Dict[str, Any]):
        """Save report to file.

        Args:
            report: Report dictionary
        """
        report_file = self.project_root / "FINAL_QUALITY_REPORT.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        logger.info(f"Report saved to: {report_file}")


def main():
    """Main function."""
    project_root = Path(__file__).parent.parent

    checker = FinalQualityCheck(project_root)
    all_passed = checker.run_all_checks()

    report = checker.generate_report()
    exit_code = checker.print_report(report)
    checker.save_report(report)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
