#!/bin/bash
# =============================================================================
# Utility Functions - Cleanup, jq/yq installation, and helper utilities
# =============================================================================

# Cleanup on exit
# Removes temporary directory and restores cursor visibility
cleanup() {
	if [[ -d $TEMP_DIR ]]; then
		rm -rf "$TEMP_DIR"
	fi
	tput cnorm 2>/dev/null || true
}

# Install jq if needed
# jq is required for JSON processing (GitHub API, MCP config merging)
# Returns: 0 if jq is available, 1 otherwise
ensure_jq() {
	if command -v jq &>/dev/null; then
		return 0
	fi

	print_status "Installing jq (JSON processor)..."

	if [[ $OSTYPE == "darwin"* ]]; then
		if command -v brew &>/dev/null; then
			brew install jq &>/dev/null
		else
			print_error "Homebrew not found. Please install jq manually: brew install jq"
			return 1
		fi
	elif command -v apt-get &>/dev/null; then
		sudo apt-get update &>/dev/null && sudo apt-get install -y jq &>/dev/null
	elif command -v yum &>/dev/null; then
		sudo yum install -y jq &>/dev/null
	elif command -v dnf &>/dev/null; then
		sudo dnf install -y jq &>/dev/null
	else
		print_error "Could not install jq. Please install manually"
		return 1
	fi

	if command -v jq &>/dev/null; then
		print_success "Installed jq"
		return 0
	else
		return 1
	fi
}

# Install yq if needed
# yq is required for YAML processing (rules config merging)
# Returns: 0 if yq is available, 1 otherwise
ensure_yq() {
	if command -v yq &>/dev/null; then
		return 0
	fi

	print_status "Installing yq (YAML processor)..."

	if [[ $OSTYPE == "darwin"* ]]; then
		if command -v brew &>/dev/null; then
			brew install yq &>/dev/null
		else
			print_warning "Homebrew not found. Cannot install yq automatically"
			return 1
		fi
	elif command -v apt-get &>/dev/null; then
		# Use binary installation for Linux (more reliable than package managers)
		local YQ_VERSION="v4.40.5"
		local YQ_BINARY="yq_linux_amd64"

		# Download yq binary
		if curl -sL "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY}" -o /tmp/yq 2>/dev/null; then
			chmod +x /tmp/yq
			sudo mv /tmp/yq /usr/local/bin/yq
		else
			print_warning "Failed to download yq"
			return 1
		fi
	elif command -v yum &>/dev/null || command -v dnf &>/dev/null; then
		# Use binary installation for RHEL-based systems
		local YQ_VERSION="v4.40.5"
		local YQ_BINARY="yq_linux_amd64"

		if curl -sL "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY}" -o /tmp/yq 2>/dev/null; then
			chmod +x /tmp/yq
			sudo mv /tmp/yq /usr/local/bin/yq
		else
			print_warning "Failed to download yq"
			return 1
		fi
	else
		print_warning "Could not install yq automatically"
		return 1
	fi

	if command -v yq &>/dev/null; then
		print_success "Installed yq"
		return 0
	else
		return 1
	fi
}

# Check required system dependencies
# Verifies that critical commands are available
# Returns: 0 if all required dependencies available, 1 otherwise
check_required_dependencies() {
	local missing=()

	# Check for curl (critical for downloads)
	if ! command -v curl &>/dev/null; then
		missing+=("curl")
	fi

	# Check for basic POSIX tools (should always be available)
	for cmd in mkdir cp mv rm chmod find grep awk sed; do
		if ! command -v "$cmd" &>/dev/null; then
			missing+=("$cmd")
		fi
	done

	if [[ ${#missing[@]} -gt 0 ]]; then
		print_error "Missing required dependencies: ${missing[*]}"
		echo ""
		echo "Please install the missing dependencies and try again:"
		echo ""
		if [[ $OSTYPE == "darwin"* ]]; then
			echo "  macOS: These tools should be pre-installed. Try reinstalling Command Line Tools:"
			echo "  xcode-select --install"
		elif command -v apt-get &>/dev/null; then
			echo "  Ubuntu/Debian:"
			echo "  sudo apt-get update && sudo apt-get install -y curl coreutils findutils"
		elif command -v yum &>/dev/null; then
			echo "  RHEL/CentOS:"
			echo "  sudo yum install -y curl coreutils findutils"
		elif command -v dnf &>/dev/null; then
			echo "  Fedora:"
			echo "  sudo dnf install -y curl coreutils findutils"
		fi
		return 1
	fi

	return 0
}
