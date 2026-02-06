#!/usr/bin/env python3
import argparse
from datetime import datetime

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def generate_certificate(output_path, name, track, cohort, issued_date, certificate_number):
  width, height = landscape(A4)
  c = canvas.Canvas(output_path, pagesize=landscape(A4))

  # Background
  c.setFillColor(colors.whitesmoke)
  c.rect(0, 0, width, height, fill=1, stroke=0)

  # Border
  margin = 36
  c.setStrokeColor(colors.HexColor('#0f4c81'))
  c.setLineWidth(3)
  c.rect(margin, margin, width - margin * 2, height - margin * 2, fill=0, stroke=1)

  # Title
  c.setFillColor(colors.HexColor('#0f4c81'))
  c.setFont('Helvetica-Bold', 30)
  c.drawCentredString(width / 2, height - 120, 'Certificate of Completion')

  # Body text
  c.setFillColor(colors.black)
  c.setFont('Helvetica', 14)
  c.drawCentredString(width / 2, height - 170, 'This certifies that')

  # Name
  c.setFont('Helvetica-Bold', 28)
  c.drawCentredString(width / 2, height - 220, name)

  # Course info
  c.setFont('Helvetica', 14)
  c.drawCentredString(width / 2, height - 270, 'has successfully completed the program')
  c.setFont('Helvetica-Bold', 18)
  c.drawCentredString(width / 2, height - 305, track)

  if cohort:
    c.setFont('Helvetica', 12)
    c.drawCentredString(width / 2, height - 330, f'Cohort: {cohort}')

  # Issue date and certificate number
  c.setFont('Helvetica', 12)
  c.drawString(margin + 10, margin + 40, f'Issued: {issued_date}')
  c.drawRightString(width - margin - 10, margin + 40, f'Certificate No: {certificate_number}')

  # Signature placeholder
  c.setStrokeColor(colors.HexColor('#999999'))
  c.setLineWidth(1)
  sig_y = margin + 100
  c.line(width / 2 - 120, sig_y, width / 2 + 120, sig_y)
  c.setFont('Helvetica', 10)
  c.setFillColor(colors.HexColor('#555555'))
  c.drawCentredString(width / 2, sig_y - 15, 'CVERSE Academy Director')

  c.showPage()
  c.save()


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('--output', required=True)
  parser.add_argument('--name', required=True)
  parser.add_argument('--track', required=True)
  parser.add_argument('--cohort', default='')
  parser.add_argument('--date', default=datetime.utcnow().strftime('%Y-%m-%d'))
  parser.add_argument('--number', required=True)
  args = parser.parse_args()

  generate_certificate(
    output_path=args.output,
    name=args.name,
    track=args.track,
    cohort=args.cohort,
    issued_date=args.date,
    certificate_number=args.number,
  )


if __name__ == '__main__':
  main()
