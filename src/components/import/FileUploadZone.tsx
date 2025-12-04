/**
 * FileUploadZone - Drag and drop file upload component for bank statements
 */

import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface FileUploadZoneProps {
	onFileSelect: (file: File) => void;
	isUploading?: boolean;
	progress?: number;
	maxSizeMB?: number;
	disabled?: boolean;
	className?: string;
}

const ACCEPTED_TYPES = ['application/pdf', 'text/csv'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.csv'];

export function FileUploadZone({
	onFileSelect,
	isUploading = false,
	progress = 0,
	maxSizeMB = 10,
	disabled = false,
	className,
}: FileUploadZoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);

	const validateFile = useCallback(
		(file: File): string | null => {
			const isValidType =
				ACCEPTED_TYPES.includes(file.type) ||
				ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
			if (!isValidType) return 'Tipo de arquivo não suportado. Use PDF ou CSV.';
			if (file.size > maxSizeMB * 1024 * 1024)
				return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
			if (file.size === 0) return 'O arquivo está vazio.';
			return null;
		},
		[maxSizeMB],
	);

	const handleFile = useCallback(
		(file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				setSelectedFile(null);
				return;
			}
			setError(null);
			setSelectedFile(file);
			onFileSelect(file);
		},
		[validateFile, onFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (disabled || isUploading) return;
			const files = e.dataTransfer.files;
			if (files.length > 0) handleFile(files[0]);
		},
		[disabled, isUploading, handleFile],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) handleFile(files[0]);
		},
		[handleFile],
	);

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div className={cn('w-full', className)}>
			<label
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					'relative block rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
					isDragging && 'border-primary bg-primary/5',
					error && 'border-destructive bg-destructive/5',
					!(isDragging || error) && 'border-muted-foreground/25 hover:border-primary/50',
					(disabled || isUploading) && 'pointer-events-none opacity-50',
				)}
			>
				<input
					type="file"
					accept={ACCEPTED_EXTENSIONS.join(',')}
					onChange={handleInputChange}
					disabled={disabled || isUploading}
					className="sr-only"
				/>

				{isUploading ? (
					<div className="flex flex-col items-center gap-4">
						<Loader2 className="h-12 w-12 text-primary animate-spin" />
						<p className="font-medium">Enviando arquivo...</p>
						<Progress value={progress} className="w-full max-w-xs" />
					</div>
				) : selectedFile ? (
					<div className="flex items-center gap-4">
						<FileText className="h-8 w-8 text-primary" />
						<div className="flex-1 min-w-0">
							<p className="font-medium truncate">{selectedFile.name}</p>
							<p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.preventDefault();
								setSelectedFile(null);
								setError(null);
							}}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center gap-4 text-center">
						<Upload className="h-12 w-12 text-muted-foreground" />
						<div>
							<p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
							<p className="text-sm text-muted-foreground">
								PDF ou CSV de extratos bancários (máx. {maxSizeMB}MB)
							</p>
						</div>
					</div>
				)}
			</label>
			{error && <p className="mt-2 text-sm text-destructive">{error}</p>}
		</div>
	);
}

export default FileUploadZone;
