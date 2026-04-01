#!/usr/bin/env python3
"""
Security Audit Script para CLAUDIA

Verifica configuraciones de seguridad y detecta vulnerabilidades potenciales.

Uso:
    python scripts/security_audit.py
"""

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class SecurityAuditor:
    """Auditor de seguridad para CLAUDIA."""

    def __init__(self, project_root: Path):
        """Inicializa el auditor.

        Args:
            project_root: Ruta raíz del proyecto
        """
        self.project_root = project_root
        self.issues: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.passed_checks: List[str] = []

    def add_issue(self, severity: str, category: str, message: str, file: str = None):
        """Agrega un issue de seguridad.

        Args:
            severity: CRITICAL, HIGH, MEDIUM, LOW
            category: Categoría del issue
            message: Descripción del issue
            file: Archivo relacionado (opcional)
        """
        issue = {
            "severity": severity,
            "category": category,
            "message": message,
            "file": file,
        }
        if severity in ["CRITICAL", "HIGH"]:
            self.issues.append(issue)
        else:
            self.warnings.append(issue)

    def add_pass(self, message: str):
        """Agrega un check que pasó exitosamente.

        Args:
            message: Descripción del check
        """
        self.passed_checks.append(message)

    def check_env_files(self):
        """Verifica configuración de archivos .env."""
        logger.info("Checking environment configuration...")

        # Verificar que existe .env.example
        env_example = self.project_root / ".env.example"
        if not env_example.exists():
            self.add_issue(
                "MEDIUM",
                "Configuration",
                ".env.example file not found",
            )
        else:
            self.add_pass(".env.example exists")

        # Verificar que .env NO está en git
        gitignore = self.project_root / ".gitignore"
        if gitignore.exists():
            content = gitignore.read_text()
            if ".env" in content and "!.env.example" in content:
                self.add_pass(".env properly ignored in git")
            elif ".env" in content:
                self.add_pass(".env ignored in git")
            else:
                self.add_issue(
                    "HIGH",
                    "Configuration",
                    ".env file not in .gitignore - risk of exposing secrets",
                )

        # Verificar que .env existe (para producción)
        env_file = self.project_root / ".env"
        if not env_file.exists():
            self.add_issue(
                "LOW",
                "Configuration",
                ".env file not found (okay for Cloud Functions)",
            )

    def check_secrets_in_code(self):
        """Busca secrets hardcodeados en el código."""
        logger.info("Scanning for hardcoded secrets...")

        patterns = {
            "API Key": re.compile(r"(api[_-]?key|apikey)\s*=\s*['\"][a-zA-Z0-9]{20,}['\"]", re.I),
            "Token": re.compile(r"(token|secret)\s*=\s*['\"][a-zA-Z0-9]{20,}['\"]", re.I),
            "Password": re.compile(r"password\s*=\s*['\"][^'\"]{1,}['\"]", re.I),
            "Private Key": re.compile(r"-----BEGIN (RSA )?PRIVATE KEY-----"),
        }

        python_files = list(self.project_root.rglob("*.py"))
        found_secrets = False

        for py_file in python_files:
            # Ignorar archivos de test y este script
            if "test_" in py_file.name or "security_audit" in py_file.name:
                continue

            try:
                content = py_file.read_text(encoding="utf-8")
                for secret_type, pattern in patterns.items():
                    matches = pattern.findall(content)
                    if matches:
                        self.add_issue(
                            "CRITICAL",
                            "Secrets",
                            f"Possible {secret_type} hardcoded in code",
                            str(py_file.relative_to(self.project_root)),
                        )
                        found_secrets = True
            except Exception as e:
                logger.debug(f"Could not read {py_file}: {e}")

        if not found_secrets:
            self.add_pass("No hardcoded secrets found")

    def check_input_validation(self):
        """Verifica que se valida input de usuarios."""
        logger.info("Checking input validation...")

        # Verificar que existe módulo de seguridad
        security_module = self.project_root / "claudia_modules" / "security.py"
        if security_module.exists():
            self.add_pass("Security module exists")

            content = security_module.read_text()
            if "sanitize" in content and "validate" in content:
                self.add_pass("Input validation functions present")
            else:
                self.add_issue(
                    "MEDIUM",
                    "Input Validation",
                    "Security module lacks validation functions",
                )
        else:
            self.add_issue(
                "HIGH",
                "Input Validation",
                "No security module found",
            )

    def check_rate_limiting(self):
        """Verifica implementación de rate limiting."""
        logger.info("Checking rate limiting...")

        rate_limiter = self.project_root / "claudia_modules" / "rate_limiter.py"
        if rate_limiter.exists():
            self.add_pass("Rate limiter module exists")

            # Verificar que se usa en main.py
            main_file = self.project_root / "main.py"
            if main_file.exists():
                content = main_file.read_text()
                if "rate_limit" in content.lower():
                    self.add_pass("Rate limiting integrated in main handler")
                else:
                    self.add_issue(
                        "MEDIUM",
                        "Rate Limiting",
                        "Rate limiter not used in main handler",
                    )
        else:
            self.add_issue(
                "MEDIUM",
                "Rate Limiting",
                "No rate limiter implementation found",
            )

    def check_logging_security(self):
        """Verifica que no se loguean datos sensibles."""
        logger.info("Checking logging practices...")

        python_files = list(self.project_root.rglob("*.py"))
        sensitive_logs = False

        for py_file in python_files:
            try:
                content = py_file.read_text(encoding="utf-8")

                # Buscar logs de datos sensibles
                if re.search(r"logger\.(info|debug|warning).*password", content, re.I):
                    self.add_issue(
                        "HIGH",
                        "Logging",
                        "Possible password logging",
                        str(py_file.relative_to(self.project_root)),
                    )
                    sensitive_logs = True

                if re.search(r"logger\.(info|debug|warning).*token", content, re.I):
                    self.add_issue(
                        "HIGH",
                        "Logging",
                        "Possible token logging",
                        str(py_file.relative_to(self.project_root)),
                    )
                    sensitive_logs = True

            except Exception as e:
                logger.debug(f"Could not read {py_file}: {e}")

        if not sensitive_logs:
            self.add_pass("No sensitive data in logs detected")

    def check_dependencies(self):
        """Verifica vulnerabilidades en dependencias."""
        logger.info("Checking dependencies...")

        requirements = self.project_root / "requirements.txt"
        if requirements.exists():
            self.add_pass("requirements.txt exists")

            # Sugerir uso de pip-audit o safety
            self.add_issue(
                "LOW",
                "Dependencies",
                "Run 'pip-audit' to check for known vulnerabilities",
            )
        else:
            self.add_issue(
                "MEDIUM",
                "Dependencies",
                "No requirements.txt found",
            )

    def check_https_enforcement(self):
        """Verifica que se usa HTTPS."""
        logger.info("Checking HTTPS enforcement...")

        # Verificar URLs hardcodeadas
        python_files = list(self.project_root.rglob("*.py"))
        http_found = False

        for py_file in python_files:
            try:
                content = py_file.read_text(encoding="utf-8")

                # Buscar URLs HTTP (no HTTPS)
                if re.search(r"['\"]http://(?!localhost|127\.0\.0\.1)", content):
                    self.add_issue(
                        "MEDIUM",
                        "HTTPS",
                        "HTTP URL found (should use HTTPS)",
                        str(py_file.relative_to(self.project_root)),
                    )
                    http_found = True

            except Exception as e:
                logger.debug(f"Could not read {py_file}: {e}")

        if not http_found:
            self.add_pass("All URLs use HTTPS")

    def check_firebase_rules(self):
        """Verifica reglas de Firestore."""
        logger.info("Checking Firebase security rules...")

        rules_file = self.project_root / "firestore.rules"
        if rules_file.exists():
            self.add_pass("firestore.rules exists")

            content = rules_file.read_text()
            if (
                "allow read, write: if false" in content
                or "allow write: if request.auth" in content
            ):
                self.add_pass("Firestore rules include authentication checks")
            else:
                self.add_issue(
                    "CRITICAL",
                    "Database Security",
                    "Firestore rules may be too permissive",
                )
        else:
            self.add_issue(
                "CRITICAL",
                "Database Security",
                "No firestore.rules file found",
            )

    def generate_report(self) -> Dict[str, Any]:
        """Genera reporte de auditoría.

        Returns:
            Diccionario con resultados
        """
        critical = sum(1 for i in self.issues if i["severity"] == "CRITICAL")
        high = sum(1 for i in self.issues if i["severity"] == "HIGH")
        medium = sum(1 for i in self.issues + self.warnings if i["severity"] == "MEDIUM")
        low = sum(1 for i in self.warnings if i["severity"] == "LOW")

        return {
            "summary": {
                "total_checks": len(self.passed_checks) + len(self.issues) + len(self.warnings),
                "passed": len(self.passed_checks),
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low,
            },
            "issues": self.issues,
            "warnings": self.warnings,
            "passed_checks": self.passed_checks,
        }

    def print_report(self, report: Dict[str, Any]):
        """Imprime reporte legible.

        Args:
            report: Diccionario con reporte
        """
        print("\n" + "=" * 70)
        print("CLAUDIA SECURITY AUDIT REPORT")
        print("=" * 70)

        summary = report["summary"]
        print(f"\n📊 SUMMARY:")
        print(f"   Total Checks: {summary['total_checks']}")
        print(f"   ✅ Passed: {summary['passed']}")
        print(f"   🔴 Critical: {summary['critical']}")
        print(f"   🟠 High: {summary['high']}")
        print(f"   🟡 Medium: {summary['medium']}")
        print(f"   🔵 Low: {summary['low']}")

        if report["issues"]:
            print(f"\n🚨 CRITICAL & HIGH ISSUES:")
            for issue in report["issues"]:
                print(f"\n   [{issue['severity']}] {issue['category']}")
                print(f"   {issue['message']}")
                if issue["file"]:
                    print(f"   File: {issue['file']}")

        if report["warnings"]:
            print(f"\n⚠️  MEDIUM & LOW WARNINGS:")
            for warning in report["warnings"]:
                print(f"\n   [{warning['severity']}] {warning['category']}")
                print(f"   {warning['message']}")
                if warning["file"]:
                    print(f"   File: {warning['file']}")

        print(f"\n✅ PASSED CHECKS ({len(report['passed_checks'])}):")
        for check in report["passed_checks"]:
            print(f"   • {check}")

        print("\n" + "=" * 70)

        # Determinar estado general
        if summary["critical"] > 0:
            print("🔴 SECURITY STATUS: CRITICAL - Immediate action required")
            return 2
        elif summary["high"] > 0:
            print("🟠 SECURITY STATUS: HIGH RISK - Action recommended")
            return 1
        elif summary["medium"] > 0:
            print("🟡 SECURITY STATUS: MEDIUM RISK - Review recommended")
            return 0
        else:
            print("✅ SECURITY STATUS: GOOD - No critical issues found")
            return 0

    def run_audit(self) -> int:
        """Ejecuta auditoría completa.

        Returns:
            Exit code (0 = success, 1 = warnings, 2 = critical)
        """
        logger.info("Starting security audit...\n")

        self.check_env_files()
        self.check_secrets_in_code()
        self.check_input_validation()
        self.check_rate_limiting()
        self.check_logging_security()
        self.check_dependencies()
        self.check_https_enforcement()
        self.check_firebase_rules()

        report = self.generate_report()
        exit_code = self.print_report(report)

        return exit_code


def main():
    """Función principal."""
    project_root = Path(__file__).parent.parent
    auditor = SecurityAuditor(project_root)
    exit_code = auditor.run_audit()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
